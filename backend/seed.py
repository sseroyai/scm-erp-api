from datetime import datetime, timedelta
from database import engine, SessionLocal, Base
from models import (
    DealerCompany, CustomUser, ProductCategory, ProductModel, ProductOption,
    Order, OrderStatusHistory, PromotionInventory, EmailNotificationConfig,
    UserRole, OrderStatus, PromotionStatus, OrderDirection
)

def init_seed():
    # Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(DealerCompany).first():
            print("Seed data already exists. Skipping initialization.")
            return

        # 1. 딜러사 마스터 (DealerCompany)
        dealers = [
            DealerCompany(name="TechMachinery GmbH", country="Germany", region="Western Europe"),
            DealerCompany(name="Alpha Precision S.R.L.", country="Italy", region="Southern Europe"),
            DealerCompany(name="Nordic Tooling AB", country="Sweden", region="Northern Europe"),
            DealerCompany(name="EuroLathe Polska Sp. z o.o.", country="Poland", region="Eastern Europe"),
            DealerCompany(name="Iberia CNC Solutions", country="Spain", region="Southern Europe"),
        ]
        db.add_all(dealers)
        db.commit()

        for d in dealers:
            db.refresh(d)

        # 2. 사용자 (CustomUser)
        users = [
            CustomUser(
                username="scm_admin_kr",
                email="admin@global-scm.erp",
                role=UserRole.SCM_ADMIN
            ),
            CustomUser(
                username="rsm_west",
                email="hans.weber@global-scm.erp",
                role=UserRole.RSM,
                region="Western Europe"
            ),
            CustomUser(
                username="rsm_south",
                email="marco.rossi@global-scm.erp",
                role=UserRole.RSM,
                region="Southern Europe"
            ),
            CustomUser(
                username="dealer_de",
                email="klaus@techmachinery.de",
                role=UserRole.DEALER,
                dealer_company_id=dealers[0].id
            ),
            CustomUser(
                username="dealer_it",
                email="sofia@alphaprecision.it",
                role=UserRole.DEALER,
                dealer_company_id=dealers[1].id
            ),
        ]
        db.add_all(users)
        db.commit()

        for u in users:
            db.refresh(u)

        # 3. 기계 카테고리 (ProductCategory)
        categories = [
            ProductCategory(name="CNC Lathe"),
            ProductCategory(name="Machining Center"),
            ProductCategory(name="5-Axis Machining Center"),
        ]
        db.add_all(categories)
        db.commit()
        for c in categories:
            db.refresh(c)

        # 4. 기계 기본 모델 마스터 (ProductModel)
        models = [
            ProductModel(
                model_code="M-PUMA2600",
                model_name="PUMA GT2600",
                category_id=categories[0].id,
                base_spec="Chuck Size: 10 inch | Max Turning Dia: 460mm | Spindle Speed: 3500 rpm | Motor: 22 kW",
                safety_stock_qty=6
            ),
            ProductModel(
                model_code="M-DNM5700",
                model_name="DNM 5700",
                category_id=categories[1].id,
                base_spec="Table Size: 1300x570mm | Travel (X/Y/Z): 1050/570/510mm | Spindle: 12000 rpm",
                safety_stock_qty=8
            ),
            ProductModel(
                model_code="M-DVF5000",
                model_name="DVF 5000",
                category_id=categories[2].id,
                base_spec="Rotary Table Dia: 500mm | Max Load: 400kg | Spindle: 15000 rpm | 60-Tool",
                safety_stock_qty=3
            ),
        ]
        db.add_all(models)
        db.commit()

        for m in models:
            db.refresh(m)

        # 5. 모델 옵션 마스터 (ProductOption)
        options = [
            ProductOption(product_model_id=models[0].id, option_name="Fanuc 31i-B Plus Controller", is_standard=True),
            ProductOption(product_model_id=models[0].id, option_name="Chip Conveyor (Hinged)", is_standard=False),
            ProductOption(product_model_id=models[1].id, option_name="Through-Spindle Coolant", is_standard=True),
            ProductOption(product_model_id=models[2].id, option_name="Siemens 840D sl Controller", is_standard=True),
        ]
        db.add_all(options)
        db.commit()

        # 6. 발주 및 추적 (Order)
        now = datetime.utcnow()
        orders = [
            # CONFIRMED
            Order(reference_no="REF-2026-8001", serial_number="SN-KR-8001", product_model_id=models[0].id, dealer_company_id=dealers[0].id, rsm_user_id=users[1].id, current_status=OrderStatus.CONFIRMED, etd=now + timedelta(days=20), eta=now + timedelta(days=60)),
            # SHIPPING
            Order(reference_no="REF-2026-7101", serial_number="SN-SHP-7101", product_model_id=models[1].id, dealer_company_id=dealers[1].id, rsm_user_id=users[2].id, current_status=OrderStatus.SHIPPING, etd=now - timedelta(days=10), eta=now + timedelta(days=20)),
            # IN_STOCK
            Order(reference_no="REF-2026-6401", serial_number="SN-EUM-6401", product_model_id=models[2].id, dealer_company_id=dealers[0].id, rsm_user_id=users[1].id, current_status=OrderStatus.IN_STOCK, etd=now - timedelta(days=45), eta=now - timedelta(days=5)),
            # Corporate Stock (Rental)
            Order(reference_no="REF-CORP-001", serial_number="SN-RENT-001", product_model_id=models[0].id, dealer_company_id=dealers[2].id, rsm_user_id=users[1].id, current_status=OrderStatus.IN_STOCK, is_corporate_stock=True, stock_type="RENTAL", etd=now - timedelta(days=50), eta=now - timedelta(days=10)),
        ]
        db.add_all(orders)
        db.commit()
        for o in orders:
            db.refresh(o)

        # 7. 프로모션 (PromotionInventory)
        promotions = [
            PromotionInventory(
                order_id=orders[2].id,
                status=PromotionStatus.AVAILABLE,
            ),
        ]
        db.add_all(promotions)
        db.commit()

        # 8. 이메일 알림 설정 (EmailNotificationConfig)
        configs = [
            EmailNotificationConfig(stage="ETD_IMMEDIATE", is_active=True, email_template="출항 통지: {{ reference_no }}"),
            EmailNotificationConfig(stage="SHIPPING_INTERVAL", interval_days=10, is_active=True, email_template="운송 중 정기 보고: {{ eta }}"),
            EmailNotificationConfig(stage="HAMBURG_ARRIVAL", is_active=True, email_template="항구 도착 통지"),
            EmailNotificationConfig(stage="HAMBURG_WAREHOUSE_COMPLETE", is_active=True, email_template="창고 입고 완료 (ATP 가용)"),
        ]
        db.add_all(configs)
        db.commit()

        print("=== 유럽 SCM 재고 관리 ERP 시드 데이터 생성 완료! ===")

    finally:
        db.close()

if __name__ == "__main__":
    init_seed()
