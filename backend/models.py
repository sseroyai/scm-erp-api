import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Enum, Text, JSON, Float
from sqlalchemy.orm import relationship
from database import Base

class UserRole(str, enum.Enum):
    SCM_ADMIN = "SCM_ADMIN"
    RSM = "RSM"
    DEALER = "DEALER"

class OrderStatus(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    IN_PRODUCTION = "IN_PRODUCTION"
    SHIPPING = "SHIPPING"
    ARRIVED = "ARRIVED"
    IN_STOCK = "IN_STOCK"
    DISPATCHED = "DISPATCHED"
    SOLD = "SOLD"

class PromotionStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    SOLD = "SOLD"

class OrderDirection(str, enum.Enum):
    FORWARD = "FORWARD"
    BACKWARD = "BACKWARD"

class DealerCompany(Base):
    __tablename__ = "dealer_companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    country = Column(String, nullable=False)
    region = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("CustomUser", back_populates="dealer_company")
    orders = relationship("Order", back_populates="dealer_company")
    reserved_promotions = relationship("PromotionInventory", foreign_keys="[PromotionInventory.reserved_dealer_id]", back_populates="reserved_dealer")
    final_buyer_promotions = relationship("PromotionInventory", foreign_keys="[PromotionInventory.final_buyer_dealer_id]", back_populates="final_buyer_dealer")

class CustomUser(Base):
    __tablename__ = "custom_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    
    dealer_company_id = Column(Integer, ForeignKey("dealer_companies.id"), nullable=True)
    region = Column(String, nullable=True) # assigned region for RSM
    department = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dealer_company = relationship("DealerCompany", back_populates="users")
    rsm_orders = relationship("Order", back_populates="rsm_user")
    status_changes = relationship("OrderStatusHistory", back_populates="changed_by")

class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    
    models = relationship("ProductModel", back_populates="category")

class NCCode(Base):
    __tablename__ = "nc_codes"

    id = Column(Integer, primary_key=True, index=True)
    nc_code = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=False)

class IncotermCode(Base):
    __tablename__ = "incoterm_codes"

    id = Column(Integer, primary_key=True, index=True)
    incoterm_code = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=False)

class PortCode(Base):
    __tablename__ = "port_codes"

    id = Column(Integer, primary_key=True, index=True)
    port_code = Column(String, unique=True, index=True, nullable=False)
    country = Column(String, nullable=False)

class ProductModel(Base):
    __tablename__ = "product_models"

    id = Column(Integer, primary_key=True, index=True)
    model_code = Column(String, unique=True, index=True, nullable=False)
    model_name = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("product_categories.id"), nullable=False)
    base_spec = Column(Text, nullable=True)
    safety_stock_qty = Column(Integer, default=5)
    is_active = Column(Boolean, default=True)

    category = relationship("ProductCategory", back_populates="models")
    options = relationship("ProductOption", back_populates="product_model")
    orders = relationship("Order", back_populates="product_model")

class ProductOption(Base):
    __tablename__ = "product_options"

    id = Column(Integer, primary_key=True, index=True)
    product_model_id = Column(Integer, ForeignKey("product_models.id"), nullable=False)
    option_name = Column(String, nullable=False)
    is_standard = Column(Boolean, default=False)

    product_model = relationship("ProductModel", back_populates="options")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    reference_no = Column(String, unique=True, index=True, nullable=False)
    serial_number = Column(String, unique=True, index=True, nullable=True)
    
    product_model_id = Column(Integer, ForeignKey("product_models.id"), nullable=False)
    dealer_company_id = Column(Integer, ForeignKey("dealer_companies.id"), nullable=False)
    rsm_user_id = Column(Integer, ForeignKey("custom_users.id"), nullable=True)

    current_status = Column(Enum(OrderStatus), default=OrderStatus.CONFIRMED, nullable=False)
    current_status_changed_at = Column(DateTime, default=datetime.utcnow)
    
    etd = Column(DateTime, nullable=True)
    eta = Column(DateTime, nullable=True)
    
    is_corporate_stock = Column(Boolean, default=False)
    stock_type = Column(String, nullable=True) # AVAILABLE, RENTAL, SHOWROOM
    
    # 상세 주문 정보 (UI/UX 확장용)
    nc = Column(String, nullable=True)
    detail_spec = Column(String, nullable=True)
    so_no = Column(String, nullable=True)
    incoterms = Column(String, nullable=True)
    vessel = Column(String, nullable=True)
    destination_port = Column(String, nullable=True)
    price = Column(String, nullable=True)
    remark = Column(Text, nullable=True)
    dealer_order_date = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    product_model = relationship("ProductModel", back_populates="orders")
    dealer_company = relationship("DealerCompany", back_populates="orders")
    rsm_user = relationship("CustomUser", back_populates="rsm_orders")
    
    history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")
    promotion = relationship("PromotionInventory", back_populates="order", uselist=False, cascade="all, delete-orphan")

class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    from_status = Column(Enum(OrderStatus), nullable=False)
    to_status = Column(Enum(OrderStatus), nullable=False)
    direction = Column(Enum(OrderDirection), nullable=False) # FORWARD / BACKWARD
    changed_by_id = Column(Integer, ForeignKey("custom_users.id"), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)
    reason = Column(Text, nullable=True)
    snapshot = Column(JSON, nullable=True) # e.g. {"etd": "...", "eta": "..."}

    order = relationship("Order", back_populates="history")
    changed_by = relationship("CustomUser", back_populates="status_changes")

class PromotionInventory(Base):
    __tablename__ = "promotion_inventory"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    status = Column(Enum(PromotionStatus), default=PromotionStatus.AVAILABLE, nullable=False)
    
    reserved_dealer_id = Column(Integer, ForeignKey("dealer_companies.id"), nullable=True)
    reservation_expiry = Column(DateTime, nullable=True)
    final_buyer_dealer_id = Column(Integer, ForeignKey("dealer_companies.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="promotion")
    reserved_dealer = relationship("DealerCompany", foreign_keys=[reserved_dealer_id], back_populates="reserved_promotions")
    final_buyer_dealer = relationship("DealerCompany", foreign_keys=[final_buyer_dealer_id], back_populates="final_buyer_promotions")

class EmailNotificationConfig(Base):
    __tablename__ = "email_notification_configs"

    id = Column(Integer, primary_key=True, index=True)
    stage = Column(String, nullable=False) # ETD_IMMEDIATE, SHIPPING_INTERVAL, HAMBURG_ARRIVAL, HAMBURG_WAREHOUSE_COMPLETE
    interval_days = Column(Integer, nullable=True) # e.g. 10 for SHIPPING_INTERVAL
    is_active = Column(Boolean, default=True, nullable=False)
    email_template = Column(Text, nullable=True)

class BusinessPlan(Base):
    __tablename__ = "business_plans"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False, index=True)
    month = Column(String, nullable=False) # "1월", "2월", ...
    
    plan_eur = Column(Float, nullable=True)
    plan_krw = Column(Float, nullable=True)
    plan_qty = Column(Integer, nullable=True)
    
    act_eur = Column(Float, nullable=True)
    act_krw = Column(Float, nullable=True)
    act_qty = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
