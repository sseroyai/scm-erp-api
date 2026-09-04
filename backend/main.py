from datetime import datetime, timedelta
import io
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Query, Header
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import pandas as pd

from database import get_db, engine, Base, SessionLocal
import models
import schemas
from seed import init_seed
from scheduler import start_scheduler, stop_scheduler
from email_service import send_etd_notification, send_warehouse_arrival_notification, send_port_arrival_notification
from storage import default_storage

app = FastAPI(
    title="공작기계 글로벌 SCM 재고 관리 ERP API (V5)",
    description="유럽 현지 법인 및 딜러 협업을 위한 실시간 SCM 재고/배송 추적 및 영업 분석 API",
    version="5.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    
    # --- TEST SETUP PATCH ---
    db = SessionLocal()
    try:
        # 1. Update EmailNotificationConfig SHIPPING_INTERVAL to 10
        config = db.query(models.EmailNotificationConfig).filter_by(stage="SHIPPING_INTERVAL").first()
        if config:
            config.interval_days = 10

        # Schema Migration for custom_users (add department, password_hash)
        try:
            db.execute(text("ALTER TABLE custom_users ADD COLUMN department VARCHAR"))
            db.commit()
        except Exception:
            db.rollback()
            
        try:
            db.execute(text("ALTER TABLE custom_users ADD COLUMN password_hash VARCHAR"))
            db.commit()
        except Exception:
            db.rollback()
            
        try:
            db.execute(text("UPDATE custom_users SET password_hash = '1234' WHERE password_hash IS NULL"))
            db.commit()
        except Exception:
            db.rollback()

        # Schema Migration for orders (add is_timeline_completed)
        try:
            db.execute(text("ALTER TABLE orders ADD COLUMN is_timeline_completed BOOLEAN DEFAULT FALSE"))
            db.commit()
        except Exception:
            db.rollback()
        
        # 2. Update dealer emails to test emails
        dealers = db.query(models.CustomUser).filter(models.CustomUser.role == models.UserRole.DEALER).all()
        test_emails = ["jypark@hyundai-wia.de", "freelogin3975@gmail.com"]
        for i, dealer in enumerate(dealers):
            dealer.email = test_emails[i % len(test_emails)]
            
        db.commit()
    except Exception as e:
        print("Error in startup patch:", e)
    finally:
        db.close()
    # ------------------------
    
    # 환경 변수를 통해 스케줄러 실행 여부 결정 (PaaS 환경에서 중복 실행 방지)
    if os.environ.get("RUN_SCHEDULER", "true").lower() == "true":
        start_scheduler()

@app.on_event("shutdown")
def on_shutdown():
    if os.environ.get("RUN_SCHEDULER", "true").lower() == "true":
        stop_scheduler()

# ==========================================
# 0. 초기 시드 데이터 생성 API
# ==========================================
@app.post("/api/seed", summary="시드 데이터 자동 초기화 및 생성")
def run_seed_data():
    try:
        init_seed()
        return {"status": "success", "message": "유럽 SCM 재고 관리 ERP 시드 데이터가 성공적으로 적재되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"시드 생성 실패: {str(e)}")

# ==========================================
# 1. 마스터 데이터 조회 API (Users, Dealers, Models)
# ==========================================
def get_current_role(x_user_role: Optional[str] = Header(None)):
    if x_user_role:
        return x_user_role.upper()
    return None

@app.get("/api/dealers", response_model=List[schemas.DealerCompanyOut])
def get_dealers(db: Session = Depends(get_db)):
    dealers = db.query(models.DealerCompany).all()
    # WME를 가장 최상단으로 정렬하고, 나머지는 이름순 정렬
    return sorted(dealers, key=lambda d: (0 if d.name == 'WME' else 1, d.name))

@app.get("/api/users", response_model=List[schemas.CustomUserOut])
def get_users(role: Optional[models.UserRole] = None, db: Session = Depends(get_db), current_role: Optional[str] = Depends(get_current_role)):
    if current_role == "RSM":
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    query = db.query(models.CustomUser)
    if role:
        query = query.filter(models.CustomUser.role == role)
    return query.all()

@app.post("/api/users", response_model=schemas.CustomUserOut)
def create_user(payload: schemas.CustomUserCreate, db: Session = Depends(get_db), current_role: Optional[str] = Depends(get_current_role)):
    if current_role == "RSM":
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    existing = db.query(models.CustomUser).filter(
        (models.CustomUser.username == payload.username) | 
        (models.CustomUser.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 사용 중인 사용자 이름 또는 이메일입니다.")
    
    new_user = models.CustomUser(
        username=payload.username,
        email=payload.email,
        role=payload.role,
        dealer_company_id=payload.dealer_company_id,
        department=payload.department
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.patch("/api/users/{user_id}", response_model=schemas.CustomUserOut)
def update_user_admin(user_id: int, payload: schemas.AdminUserUpdate, db: Session = Depends(get_db), current_role: Optional[str] = Depends(get_current_role)):
    if current_role == "RSM":
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    user = db.query(models.CustomUser).filter(models.CustomUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    if payload.username is not None and payload.username != user.username:
        exists = db.query(models.CustomUser).filter(models.CustomUser.username == payload.username).first()
        if exists:
            raise HTTPException(status_code=400, detail="이미 사용 중인 사용자 이름입니다.")
        user.username = payload.username

    if payload.email is not None and payload.email != user.email:
        exists = db.query(models.CustomUser).filter(models.CustomUser.email == payload.email).first()
        if exists:
            raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")
        user.email = payload.email

    if payload.role is not None:
        user.role = payload.role

    if payload.department is not None:
        user.department = payload.department
        
    if payload.dealer_company_id is not None:
        user.dealer_company_id = payload.dealer_company_id

    # If role changed to DEALER, department shouldn't be relevant. Similarly, if it's SCM_ADMIN/RSM, dealer_company_id shouldn't be relevant.
    # We will enforce this on the frontend, but here we just update what's given.

    db.commit()
    db.refresh(user)
    return user

@app.delete("/api/users/{user_id}")
def delete_user_admin(user_id: int, db: Session = Depends(get_db), current_role: Optional[str] = Depends(get_current_role)):
    if current_role == "RSM":
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    user = db.query(models.CustomUser).filter(models.CustomUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    db.delete(user)
    db.commit()
    return {"status": "success", "message": "사용자가 삭제되었습니다."}

@app.get("/api/models", response_model=List[schemas.ProductModelOut])
def get_product_models(db: Session = Depends(get_db)):
    return db.query(models.ProductModel).order_by(models.ProductModel.model_code.asc()).all()

@app.get("/api/categories", response_model=List[schemas.ProductCategoryOut])
def get_product_categories(db: Session = Depends(get_db)):
    return db.query(models.ProductCategory).all()

# ==========================================
# 2. 주문 및 배송 진행 상태 추적 API
# ==========================================
@app.get("/api/master-data/nc-codes")
def get_nc_codes(db: Session = Depends(get_db)):
    codes = db.query(models.NCCode).all()
    return [{"nc_code": c.nc_code, "description": c.description} for c in codes]

@app.get("/api/master-data/incoterm-codes")
def get_incoterm_codes(db: Session = Depends(get_db)):
    codes = db.query(models.IncotermCode).all()
    return [{"incoterm_code": c.incoterm_code, "description": c.description} for c in codes]

@app.get("/api/master-data/port-codes")
def get_port_codes(db: Session = Depends(get_db)):
    codes = db.query(models.PortCode).all()
    return [{"port_code": c.port_code, "country": c.country} for c in codes]
@app.get("/api/orders", response_model=List[schemas.OrderOut])
def get_orders(
    dealer_id: Optional[int] = Query(None, description="DEALER 권한인 경우 본인 회사 ID만 조회"),
    rsm_id: Optional[int] = Query(None, description="RSM 권한인 경우 본인 담당 지역 주문만 조회"),
    status_filter: Optional[models.OrderStatus] = Query(None, description="상태값 필터"),
    is_corporate_stock: Optional[bool] = Query(None, description="법인 재고 여부 필터"),
    exclude_completed: bool = Query(False, description="출고/판매완료된 항목 제외 여부"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Order).join(models.DealerCompany, isouter=True)
    if dealer_id:
        query = query.filter(models.Order.dealer_company_id == dealer_id)
    if rsm_id:
        query = query.filter(models.Order.rsm_user_id == rsm_id)
    if status_filter:
        query = query.filter(models.Order.current_status == status_filter)
    if exclude_completed:
        query = query.filter(
            ~models.Order.current_status.in_([models.OrderStatus.DISPATCHED, models.OrderStatus.SOLD]),
            models.Order.is_timeline_completed.isnot(True)
        )
    if is_corporate_stock is not None:
        if is_corporate_stock:
            query = query.filter(
                (models.Order.is_corporate_stock == True) | 
                (models.DealerCompany.name.ilike('WME'))
            )
        else:
            query = query.filter(
                (models.Order.is_corporate_stock == False) & 
                (models.DealerCompany.name.notilike('WME'))
            )
    return query.order_by(models.Order.id.desc()).all()

@app.post("/api/orders", response_model=schemas.OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: schemas.OrderCreate,
    db: Session = Depends(get_db)
):
    # Check if reference_no already exists
    existing = db.query(models.Order).filter(models.Order.reference_no == payload.reference_no).first()
    if existing:
        raise HTTPException(status_code=400, detail="이미 존재하는 발주번호(Reference No)입니다.")

    dealer = db.query(models.DealerCompany).filter(models.DealerCompany.id == payload.dealer_company_id).first()
    is_corp_stock = payload.is_corporate_stock
    stock_type = payload.stock_type
    
    if dealer and dealer.name.upper() == 'WME':
        is_corp_stock = True
        if not stock_type:
            stock_type = 'AVAILABLE'

    new_order = models.Order(
        reference_no=payload.reference_no,
        serial_number=payload.serial_number,
        product_model_id=payload.product_model_id,
        dealer_company_id=payload.dealer_company_id,
        rsm_user_id=payload.rsm_user_id,
        is_corporate_stock=is_corp_stock,
        stock_type=stock_type,
        current_status=models.OrderStatus.CONFIRMED,
        etd=payload.etd or (datetime.utcnow() + timedelta(days=20)),
        eta=payload.eta or (datetime.utcnow() + timedelta(days=60)),
        nc=payload.nc,
        incoterms=payload.incoterms,
        destination_port=payload.destination_port,
        dealer_order_date=payload.dealer_order_date
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

@app.patch("/api/orders/{order_id}", response_model=schemas.OrderOut)
def update_order_info(
    order_id: int,
    payload: schemas.OrderUpdate,
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="해당 발주 건을 찾을 수 없습니다.")
    
    if payload.serial_number is not None:
        # Check if S/N already exists for another order
        if payload.serial_number.strip() != "":
            existing_sn = db.query(models.Order).filter(
                models.Order.serial_number == payload.serial_number,
                models.Order.id != order_id
            ).first()
            if existing_sn:
                raise HTTPException(status_code=400, detail="이미 존재하는 시리얼 번호(S/N)입니다.")
        order.serial_number = payload.serial_number or None

    if payload.product_model_id is not None:
        model = db.query(models.ProductModel).filter(models.ProductModel.id == payload.product_model_id).first()
        if not model:
            raise HTTPException(status_code=404, detail="유효하지 않은 모델입니다.")
        order.product_model_id = payload.product_model_id

    if payload.is_timeline_completed is not None:
        order.is_timeline_completed = payload.is_timeline_completed

    if payload.stock_type is not None:
        order.stock_type = payload.stock_type
        if payload.stock_type == "PROMOTION":
            existing_promo = db.query(models.PromotionInventory).filter(models.PromotionInventory.order_id == order.id).first()
            if not existing_promo:
                new_promo = models.PromotionInventory(order_id=order.id, status=models.PromotionStatus.AVAILABLE)
                db.add(new_promo)

    if payload.reference_no is not None:
        order.reference_no = payload.reference_no
    if payload.dealer_company_id is not None:
        dealer = db.query(models.DealerCompany).filter(models.DealerCompany.id == payload.dealer_company_id).first()
        if not dealer:
            raise HTTPException(status_code=404, detail="유효하지 않은 딜러입니다.")
        order.dealer_company_id = payload.dealer_company_id
    if payload.destination_port is not None:
        order.destination_port = payload.destination_port
    if payload.price is not None:
        order.price = payload.price

    if payload.nc is not None:
        order.nc = payload.nc
    if payload.detail_spec is not None:
        order.detail_spec = payload.detail_spec
    if payload.so_no is not None:
        order.so_no = payload.so_no
    if payload.incoterms is not None:
        order.incoterms = payload.incoterms
    if payload.vessel is not None:
        order.vessel = payload.vessel
    if payload.remark is not None:
        order.remark = payload.remark
    if hasattr(payload, 'dealer_order_date') and payload.dealer_order_date is not None:
        order.dealer_order_date = payload.dealer_order_date

    db.commit()
    db.refresh(order)
    return order

@app.patch("/api/orders/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(
    order_id: int,
    payload: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="해당 발주 건을 찾을 수 없습니다.")
    
    # 역방향 제어 시 사유(reason) 필수
    if payload.direction == models.OrderDirection.BACKWARD and not payload.reason:
        raise HTTPException(status_code=400, detail="역방향 상태 변경 시 사유(reason)는 필수입니다.")

    from_status = order.current_status
    
    # 1. 상태 업데이트
    order.current_status = payload.to_status
    order.current_status_changed_at = datetime.utcnow()
    
    if payload.eta:
        order.eta = payload.eta
    if payload.etd:
        order.etd = payload.etd
        
    # Trigger Notifications based on status change
    if payload.direction == models.OrderDirection.FORWARD:
        if payload.to_status == models.OrderStatus.SHIPPING:
            # ETD notification
            etd_str = order.etd.strftime('%Y-%m-%d') if order.etd else "미정"
            eta_str = order.eta.strftime('%Y-%m-%d') if order.eta else "미정"
            
            # 발송 테스트용 고정 이메일 주소
            to_email = "freelogin3975@gmail.com; jypark@hyundai-wia.de;"
            send_etd_notification(to_email, order.reference_no, etd_str, eta_str)
            
        elif payload.to_status == models.OrderStatus.ARRIVED:
            # Port arrival notification
            # 발송 테스트용 고정 이메일 주소
            to_email = "freelogin3975@gmail.com; jypark@hyundai-wia.de;"
            send_port_arrival_notification(to_email, order.reference_no)
            
        elif payload.to_status == models.OrderStatus.IN_STOCK:
            # Warehouse arrival notification
            # 발송 테스트용 고정 이메일 주소
            to_email = "freelogin3975@gmail.com; jypark@hyundai-wia.de;"
            send_warehouse_arrival_notification(to_email, order.reference_no, order.stock_type)

    # 2. 역방향(BACKWARD) 부작용(Side Effect) 처리
    if payload.direction == models.OrderDirection.BACKWARD:
        # 예: IN_STOCK -> ARRIVED 일 경우 가용재고 취소 로직 등 필요시 작성
        pass

    # 3. 이력(History) 테이블 기록 생성
    history = models.OrderStatusHistory(
        order_id=order.id,
        from_status=from_status,
        to_status=payload.to_status,
        direction=payload.direction,
        changed_by_id=payload.changed_by_id,
        reason=payload.reason,
        snapshot={
            "etd": order.etd.isoformat() if order.etd else None,
            "eta": order.eta.isoformat() if order.eta else None
        }
    )
    db.add(history)
    
    db.commit()
    db.refresh(order)
    return order

@app.get("/api/orders/{order_id}/history", response_model=List[schemas.OrderStatusHistoryOut])
def get_order_history(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="해당 발주 건을 찾을 수 없습니다.")
    return db.query(models.OrderStatusHistory).filter(models.OrderStatusHistory.order_id == order_id).order_by(models.OrderStatusHistory.changed_at.desc()).all()

@app.patch("/api/orders/{order_id}/assign-dealer", response_model=schemas.OrderOut)
def assign_order_to_dealer(
    order_id: int,
    payload: schemas.OrderAssignDealerUpdate,
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="해당 발주 건을 찾을 수 없습니다.")
    
    is_wme = order.dealer_company and order.dealer_company.name.upper() == 'WME'
    if not order.is_corporate_stock and not is_wme:
        raise HTTPException(status_code=400, detail="가용 재고(ATP)로 등록된 장비만 딜러를 변경할 수 있습니다.")

    dealer = db.query(models.DealerCompany).filter(models.DealerCompany.id == payload.dealer_company_id).first()
    if not dealer:
        raise HTTPException(status_code=404, detail="유효하지 않은 딜러입니다.")

    order.dealer_company_id = dealer.id
    order.is_corporate_stock = False
    order.stock_type = None

    db.commit()
    db.refresh(order)
    return order

@app.delete("/api/orders/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="해당 발주 건을 찾을 수 없습니다.")
    
    db.delete(order)
    db.commit()
    return {"status": "success", "message": "주문이 삭제되었습니다."}

# ==========================================
# 3. 관리자 영업 통계 및 분석 API
# ==========================================
@app.get("/api/stats")
def get_sales_analytics(db: Session = Depends(get_db), current_role: Optional[str] = Depends(get_current_role)):
    if current_role == "RSM":
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    orders = db.query(models.Order).all()
    total_orders = len(orders)
    
    # 1. 상태별 분포
    status_counts = {}
    for s in models.OrderStatus:
        status_counts[s.value] = len([o for o in orders if o.current_status == s])
        
    # 2. 모델별 판매/발주 분포
    model_counts = {}
    for o in orders:
        m_name = o.product_model.model_name if o.product_model else "Unknown"
        model_counts[m_name] = model_counts.get(m_name, 0) + 1
        
    # 3. 딜러사별 기여도
    dealer_counts = {}
    for o in orders:
        d_name = o.dealer_company.name if o.dealer_company else "Unknown"
        dealer_counts[d_name] = dealer_counts.get(d_name, 0) + 1

    # 4. 국가/지역별 판매 점유율
    country_counts = {}
    for o in orders:
        c_name = o.dealer_company.country if o.dealer_company else "Unknown"
        country_counts[c_name] = country_counts.get(c_name, 0) + 1

    # 5. RSM 영업 담당자별 달성 지표
    rsm_stats = []
    rsms = db.query(models.CustomUser).filter(models.CustomUser.role == models.UserRole.RSM).all()
    for r in rsms:
        r_orders = [o for o in orders if o.rsm_user_id == r.id]
        rsm_stats.append({
            "rsm_name": r.username,
            "assigned_region": r.region,
            "order_count": len(r_orders),
            "target_count": 10,
            "achievement_rate": round(min(100.0, (len(r_orders) / 10) * 100), 1)
        })

    # 6. ATP by port
    atp_by_port = {}
    for o in orders:
        if o.current_status == models.OrderStatus.IN_STOCK:
            port_name = o.destination_port or "Unknown"
            atp_by_port[port_name] = atp_by_port.get(port_name, 0) + 1

    return {
        "kpi": {
            "total_orders": total_orders,
            "in_production": status_counts.get(models.OrderStatus.IN_PRODUCTION.value, 0),
            "in_shipping": status_counts.get(models.OrderStatus.SHIPPING.value, 0),
            "arrived_port": status_counts.get(models.OrderStatus.ARRIVED.value, 0),
            "available_atp_stock": status_counts.get(models.OrderStatus.IN_STOCK.value, 0),
            "atp_by_port": atp_by_port
        },
        "status_distribution": status_counts,
        "model_distribution": [{"model": k, "count": v} for k, v in model_counts.items()],
        "dealer_distribution": [{"dealer": k, "count": v} for k, v in dealer_counts.items()],
        "country_distribution": [{"country": k, "count": v} for k, v in country_counts.items()],
        "rsm_performance": rsm_stats
    }

# ==========================================
# 4. 프로모션 및 장기 재고 관리 API
# ==========================================
@app.get("/api/promotions", response_model=List[schemas.PromotionOut])
def get_promotions(
    status_filter: Optional[models.PromotionStatus] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.PromotionInventory)
    if status_filter:
        query = query.filter(models.PromotionInventory.status == status_filter)
    return query.order_by(models.PromotionInventory.id.asc()).all()

@app.patch("/api/promotions/{promotion_id}/reserve", response_model=schemas.PromotionOut)
def reserve_promotion(
    promotion_id: int,
    payload: schemas.PromotionReserveUpdate,
    db: Session = Depends(get_db)
):
    promo = db.query(models.PromotionInventory).filter(models.PromotionInventory.id == promotion_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="프로모션 재고를 찾을 수 없습니다.")
    if promo.status != models.PromotionStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="판매가능(AVAILABLE) 상태인 기계만 예약할 수 있습니다.")
    
    promo.status = models.PromotionStatus.RESERVED
    promo.reserved_dealer_id = payload.reserved_dealer_id
    promo.reservation_expiry = payload.reservation_expiry
    db.commit()
    db.refresh(promo)
    return promo

@app.patch("/api/promotions/{promotion_id}/cancel", response_model=schemas.PromotionOut)
def cancel_reservation(
    promotion_id: int,
    db: Session = Depends(get_db)
):
    promo = db.query(models.PromotionInventory).filter(models.PromotionInventory.id == promotion_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="프로모션 재고를 찾을 수 없습니다.")
    if promo.status != models.PromotionStatus.RESERVED:
        raise HTTPException(status_code=400, detail="예약중(RESERVED) 상태인 기계만 취소할 수 있습니다.")
    
    promo.status = models.PromotionStatus.AVAILABLE
    promo.reserved_dealer_id = None
    promo.reservation_expiry = None
    db.commit()
    db.refresh(promo)
    return promo

@app.patch("/api/promotions/{promotion_id}/sold", response_model=schemas.PromotionOut)
def confirm_sold_promotion(
    promotion_id: int,
    payload: schemas.PromotionSoldUpdate,
    db: Session = Depends(get_db)
):
    promo = db.query(models.PromotionInventory).filter(models.PromotionInventory.id == promotion_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="프로모션 재고를 찾을 수 없습니다.")
    if promo.status != models.PromotionStatus.RESERVED:
        raise HTTPException(status_code=400, detail="예약중(RESERVED) 상태인 기계만 최종 판매 완료로 전환할 수 있습니다.")
    
    promo.status = models.PromotionStatus.SOLD
    promo.final_buyer_dealer_id = payload.final_buyer_dealer_id
    db.commit()
    db.refresh(promo)
    return promo

# ==========================================
# 5. Pandas 기반 엑셀 일괄 업로드 API
# ==========================================
@app.post("/api/upload/excel")
async def upload_excel_bulk(file: UploadFile = File(...), db: Session = Depends(get_db), current_role: Optional[str] = Depends(get_current_role)):
    if current_role == "RSM":
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.")
    
    content = await file.read()
    try:
        df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"엑셀 파일 판독 오류: {str(e)}")

    # 필수 컬럼 검증 (신규 표준 헤더 사용)
    required_cols = {'MODEL', 'NC', 'P/O', 'DEALER', 'ORDER DATE', 'DETAIL SPEC', 'BUYING', 'INCOTERMS', 'PORT'}
    missing_cols = required_cols - set(df.columns)
    if missing_cols:
        return {
            "status": "error",
            "message": f"필수 컬럼이 누락되었습니다: {', '.join(missing_cols)}",
            "valid_rows": 0,
            "errors": [f"엑셀 헤더에는 최소 {', '.join(required_cols)} 열이 포함되어야 합니다."]
        }

    valid_count = 0
    errors = []
    
    # 모델 및 딜러 마스터 매핑 캐시
    models_dict = {m.model_code: m.id for m in db.query(models.ProductModel).all()}
    dealers_dict = {d.name: d.id for d in db.query(models.DealerCompany).all()}
    
    # 세션 내 중복 방지를 위한 셋
    session_ref_nos = set()
    import uuid

    for index, row in df.iterrows():
        # 신규 매핑
        m_code = str(row.get('MODEL', '')).strip()
        nc_val = str(row.get('NC', '')).strip()
        ref_no = str(row.get('P/O', '')).strip()
        price_val = str(row.get('BUYING', '')).strip()
        d_name = str(row.get('DEALER', '')).strip()
        order_date_val = row.get('ORDER DATE')
        detail_spec_val = str(row.get('DETAIL SPEC', '')).strip()
        incoterms_val = str(row.get('INCOTERMS', '')).strip()
        port_val = str(row.get('PORT', '')).strip()
        
        # 상태는 파일에 없으므로 기본값 CONFIRMED 설정
        stat_str = 'CONFIRMED'
        
        if not ref_no or not m_code:
            errors.append(f"{index + 2}행: P/O 또는 MODEL 누락")
            continue
        if m_code not in models_dict:
            errors.append(f"{index + 2}행: 시스템에 등록되지 않은 기계 MODEL ('{m_code}')")
            continue
        if d_name not in dealers_dict:
            errors.append(f"{index + 2}행: 시스템에 존재하지 않는 DEALER ('{d_name}')")
            continue
            
        if ref_no in session_ref_nos:
            errors.append(f"{index + 2}행: 파일 내 중복된 P/O ('{ref_no}') - 건너뜀")
            continue
        
        existing = db.query(models.Order).filter(models.Order.reference_no == ref_no).first()
        if not existing:
            is_corp_stock = (d_name.upper() == 'WME')
            
            # 파싱된 ORDER DATE 처리
            parsed_order_date = None
            if pd.notnull(order_date_val):
                try:
                    parsed_order_date = pd.to_datetime(order_date_val)
                except:
                    pass

            new_order = models.Order(
                reference_no=ref_no,
                serial_number=None,
                product_model_id=models_dict[m_code],
                dealer_company_id=dealers_dict[d_name],
                dealer_order_date=parsed_order_date,
                current_status=models.OrderStatus.CONFIRMED,
                etd=datetime.utcnow() + timedelta(days=20),
                eta=datetime.utcnow() + timedelta(days=60),
                is_corporate_stock=is_corp_stock,
                stock_type='AVAILABLE' if is_corp_stock else None,
                nc=nc_val if nc_val else None,
                detail_spec=detail_spec_val if detail_spec_val else None,
                incoterms=incoterms_val if incoterms_val else None,
                destination_port=port_val if port_val else None,
                price=price_val if price_val else None,
                remark=None
            )
            db.add(new_order)
            session_ref_nos.add(ref_no)
            valid_count += 1
        else:
            errors.append(f"{index + 2}행: 이미 시스템에 존재하는 P/O ('{ref_no}') - 건너뜀")

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        return {
            "status": "error",
            "message": "데이터베이스 저장 중 무결성 오류가 발생했습니다. (중복 데이터 등)",
            "valid_rows": 0,
            "errors": [str(e)]
        }

    return {
        "status": "success" if not errors else "partial_success",
        "message": f"총 {len(df)}건 중 {valid_count}건 성공적으로 데이터베이스에 적재되었습니다.",
        "valid_rows": valid_count,
        "errors": errors
    }

# ==========================================
# 6. 주기 조절형 자동 ETA 알림 스케줄러 설정 API
# ==========================================
@app.get("/api/email-configs", response_model=List[schemas.EmailConfigOut])
def get_email_configs(db: Session = Depends(get_db), current_role: Optional[str] = Depends(get_current_role)):
    if current_role == "RSM":
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    return db.query(models.EmailNotificationConfig).all()

@app.patch("/api/email-configs/{config_id}", response_model=schemas.EmailConfigOut)
def toggle_email_config(config_id: int, is_active: bool, db: Session = Depends(get_db), current_role: Optional[str] = Depends(get_current_role)):
    if current_role == "RSM":
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    config = db.query(models.EmailNotificationConfig).filter(models.EmailNotificationConfig.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="이메일 설정 규칙을 찾을 수 없습니다.")
    config.is_active = is_active
    db.commit()
    db.refresh(config)
    return config




# ==========================================
# 7. 사업계획(KGI) API
# ==========================================
@app.get("/api/business-plans", response_model=List[schemas.BusinessPlanOut])
def get_business_plans(year: int = Query(...), db: Session = Depends(get_db), current_role: Optional[str] = Depends(get_current_role)):
    if current_role == "RSM":
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    plans = db.query(models.BusinessPlan).filter(models.BusinessPlan.year == year).all()
    # Sort by month (1월, 2월 ... 12월) correctly
    def month_sort_key(plan):
        try:
            return int(plan.month.replace("월", ""))
        except:
            return 99
    return sorted(plans, key=month_sort_key)

@app.put("/api/business-plans/{year}")
def update_business_plans(year: int, plans_data: List[schemas.BusinessPlanCreate], db: Session = Depends(get_db), current_role: Optional[str] = Depends(get_current_role)):
    if current_role == "RSM":
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")
    """
    해당 연도의 사업계획 12개월 데이터를 일괄 업데이트/생성
    """
    for data in plans_data:
        plan = db.query(models.BusinessPlan).filter(
            models.BusinessPlan.year == year,
            models.BusinessPlan.month == data.month
        ).first()
        
        if plan:
            plan.plan_eur = data.plan_eur
            plan.plan_krw = data.plan_krw
            plan.plan_qty = data.plan_qty
            plan.act_eur = data.act_eur
            plan.act_krw = data.act_krw
            plan.act_qty = data.act_qty
        else:
            plan = models.BusinessPlan(
                year=year,
                month=data.month,
                plan_eur=data.plan_eur,
                plan_krw=data.plan_krw,
                plan_qty=data.plan_qty,
                act_eur=data.act_eur,
                act_krw=data.act_krw,
                act_qty=data.act_qty
            )
            db.add(plan)
    
    db.commit()
    return {"status": "success", "message": f"{year}년 사업계획이 저장되었습니다."}

# ==========================================
# 8. 사용자 프로필 API (My Data)
# ==========================================
@app.get("/api/v1/users/me", response_model=schemas.CustomUserOut)
def get_user_me(username: str = Query(..., description="임시 로그인 식별자"), db: Session = Depends(get_db)):
    user = db.query(models.CustomUser).filter(models.CustomUser.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    return user

@app.patch("/api/v1/users/me", response_model=schemas.CustomUserOut)
def update_user_me(payload: schemas.UserUpdate, username: str = Query(..., description="임시 로그인 식별자"), db: Session = Depends(get_db)):
    user = db.query(models.CustomUser).filter(models.CustomUser.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    if payload.username is not None:
        if payload.username != user.username:
            exists = db.query(models.CustomUser).filter(models.CustomUser.username == payload.username).first()
            if exists:
                raise HTTPException(status_code=400, detail="이미 사용중인 이름입니다.")
        user.username = payload.username
    if payload.email is not None:
        user.email = payload.email
    if payload.department is not None:
        user.department = payload.department
        
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/v1/users/me/change-password")
def change_password(payload: schemas.PasswordChange, username: str = Query(..., description="임시 로그인 식별자"), db: Session = Depends(get_db)):
    user = db.query(models.CustomUser).filter(models.CustomUser.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    # 1. 기존 비밀번호 확인 (DB에 해시가 있는 경우만 비교)
    if user.password_hash and user.password_hash != payload.current_password:
        raise HTTPException(status_code=400, detail="기존 비밀번호가 일치하지 않습니다.")
        
    # 2. 새 비밀번호 일치 확인
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="새 비밀번호가 일치하지 않습니다.")
        
    # 3. 비밀번호 정책 검증 (8자리 이상)
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="비밀번호는 최소 8자리 이상이어야 합니다.")
        
    # 패스워드 업데이트 (현재는 평문 저장, 추후 passlib 도입 시 변경)
    user.password_hash = payload.new_password
    db.commit()
    
    return {"status": "success", "message": "비밀번호가 성공적으로 변경되었습니다."}

# ==========================================
# 9. 로그인 인증 (Auth) API
# ==========================================
@app.post("/api/v1/auth/login")
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.CustomUser).filter(models.CustomUser.username == payload.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")
    
    if user.password_hash != payload.password:
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다.")
        
    return {
        "status": "success",
        "username": user.username,
        "role": user.role.value
    }

# ==========================================
# 10. 문서 다운로드 API
# ==========================================
@app.get("/api/documents/{filename}/download", summary="문서 파일 다운로드")
def download_document(filename: str):
    url = default_storage.get_download_url(filename)
    if url:
        return RedirectResponse(url=url)
        
    file_path = default_storage.get_file_path(filename)
    if file_path:
        return FileResponse(path=file_path, filename=filename)
        
    raise HTTPException(status_code=404, detail="File not found")

