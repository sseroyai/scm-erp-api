from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict
from models import UserRole, OrderStatus, PromotionStatus, OrderDirection

# DealerCompany Schemas
class DealerCompanyBase(BaseModel):
    name: str
    country: str
    region: str

class DealerCompanyOut(DealerCompanyBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# CustomUser Schemas
class CustomUserBase(BaseModel):
    username: str
    email: str
    role: UserRole
    dealer_company_id: Optional[int] = None
    region: Optional[str] = None
    department: Optional[str] = None

class CustomUserCreate(BaseModel):
    username: str
    email: str
    role: UserRole
    dealer_company_id: Optional[int] = None
    department: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None

class AdminUserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    dealer_company_id: Optional[int] = None
    department: Optional[str] = None
    status: Optional[str] = None # Added for future status toggling if needed


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class UserLogin(BaseModel):
    username: str
    password: str

class CustomUserOut(CustomUserBase):
    id: int
    created_at: datetime
    dealer_company: Optional[DealerCompanyOut] = None
    model_config = ConfigDict(from_attributes=True)

# ProductCategory Schemas
class ProductCategoryBase(BaseModel):
    name: str

class ProductCategoryOut(ProductCategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# ProductModel Schemas
class ProductModelBase(BaseModel):
    model_code: str
    model_name: str
    category_id: int
    base_spec: Optional[str] = None
    safety_stock_qty: int = 5
    is_active: bool = True

class ProductModelOut(ProductModelBase):
    id: int
    category: Optional[ProductCategoryOut] = None
    model_config = ConfigDict(from_attributes=True)

# ProductOption Schemas
class ProductOptionBase(BaseModel):
    product_model_id: int
    option_name: str
    is_standard: bool = False

class ProductOptionOut(ProductOptionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Order / Serial Tracking Schemas
class OrderBase(BaseModel):
    reference_no: str
    serial_number: Optional[str] = None
    product_model_id: int
    dealer_company_id: int
    rsm_user_id: Optional[int] = None
    
    current_status: OrderStatus = OrderStatus.CONFIRMED
    is_corporate_stock: bool = False
    stock_type: Optional[str] = None # AVAILABLE, RENTAL, SHOWROOM
    
    etd: Optional[datetime] = None
    eta: Optional[datetime] = None

    nc: Optional[str] = None
    detail_spec: Optional[str] = None
    so_no: Optional[str] = None
    incoterms: Optional[str] = None
    vessel: Optional[str] = None
    destination_port: Optional[str] = None
    price: Optional[str] = None
    remark: Optional[str] = None
    dealer_order_date: Optional[datetime] = None

class OrderCreate(BaseModel):
    reference_no: str
    product_model_id: int
    dealer_company_id: int
    rsm_user_id: Optional[int] = None
    serial_number: Optional[str] = None
    is_corporate_stock: bool = False
    stock_type: Optional[str] = None
    etd: Optional[datetime] = None
    eta: Optional[datetime] = None
    nc: Optional[str] = None
    incoterms: Optional[str] = None
    destination_port: Optional[str] = None
    dealer_order_date: Optional[datetime] = None

class OrderOut(OrderBase):
    id: int
    current_status_changed_at: datetime
    created_at: datetime
    product_model: Optional[ProductModelOut] = None
    dealer_company: Optional[DealerCompanyOut] = None
    rsm_user: Optional[CustomUserOut] = None
    model_config = ConfigDict(from_attributes=True)

class OrderUpdate(BaseModel):
    reference_no: Optional[str] = None
    dealer_company_id: Optional[int] = None
    serial_number: Optional[str] = None
    product_model_id: Optional[int] = None
    stock_type: Optional[str] = None
    nc: Optional[str] = None
    detail_spec: Optional[str] = None
    so_no: Optional[str] = None
    incoterms: Optional[str] = None
    destination_port: Optional[str] = None
    vessel: Optional[str] = None
    price: Optional[str] = None
    remark: Optional[str] = None
    dealer_order_date: Optional[datetime] = None

class OrderStatusUpdate(BaseModel):
    to_status: OrderStatus
    direction: OrderDirection
    reason: Optional[str] = None
    changed_by_id: int
    eta: Optional[datetime] = None
    etd: Optional[datetime] = None

class OrderAssignDealerUpdate(BaseModel):
    dealer_company_id: int

# OrderStatusHistory Schemas
class OrderStatusHistoryBase(BaseModel):
    order_id: int
    from_status: OrderStatus
    to_status: OrderStatus
    direction: OrderDirection
    changed_by_id: int
    reason: Optional[str] = None
    snapshot: Optional[Any] = None

class OrderStatusHistoryOut(OrderStatusHistoryBase):
    id: int
    changed_at: datetime
    changed_by: Optional[CustomUserOut] = None
    model_config = ConfigDict(from_attributes=True)

# Promotion Inventory Schemas
class PromotionBase(BaseModel):
    order_id: int
    status: PromotionStatus = PromotionStatus.AVAILABLE
    reserved_dealer_id: Optional[int] = None
    reservation_expiry: Optional[datetime] = None
    final_buyer_dealer_id: Optional[int] = None

class PromotionOut(PromotionBase):
    id: int
    created_at: datetime
    order: Optional[OrderOut] = None
    reserved_dealer: Optional[DealerCompanyOut] = None
    final_buyer_dealer: Optional[DealerCompanyOut] = None
    model_config = ConfigDict(from_attributes=True)

class PromotionReserveUpdate(BaseModel):
    reserved_dealer_id: int
    reservation_expiry: datetime

class PromotionSoldUpdate(BaseModel):
    final_buyer_dealer_id: int

# Email Notification Config Schemas
class EmailConfigBase(BaseModel):
    stage: str
    interval_days: Optional[int] = None
    is_active: bool = True
    email_template: Optional[str] = None

class EmailConfigOut(EmailConfigBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Business Plan Schemas
class BusinessPlanBase(BaseModel):
    year: int
    month: str
    plan_eur: Optional[float] = None
    plan_krw: Optional[float] = None
    plan_qty: Optional[int] = None
    act_eur: Optional[float] = None
    act_krw: Optional[float] = None
    act_qty: Optional[int] = None

class BusinessPlanCreate(BusinessPlanBase):
    pass

class BusinessPlanUpdate(BaseModel):
    plan_eur: Optional[float] = None
    plan_krw: Optional[float] = None
    plan_qty: Optional[int] = None
    act_eur: Optional[float] = None
    act_krw: Optional[float] = None
    act_qty: Optional[int] = None

class BusinessPlanOut(BusinessPlanBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

