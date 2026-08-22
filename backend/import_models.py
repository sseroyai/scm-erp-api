import sys
import os

# add backend path to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
from models import ProductCategory, ProductModel

models_data = [
    {"code": "E160C", "type": "CNC Turning Center"},
    {"code": "F500D", "type": "Machining Center"},
    {"code": "HD2200", "type": "Machining Center"},
    {"code": "HD2200C", "type": "Machining Center"},
    {"code": "HD2200M", "type": "Machining Center"},
    {"code": "HD2200MC", "type": "Machining Center"},
    {"code": "HD2200SY", "type": "Machining Center"},
    {"code": "HD2200Y", "type": "Machining Center"},
    {"code": "HD2600", "type": "Machining Center"},
    {"code": "HD2600LM", "type": "Machining Center"},
    {"code": "HD2600SY", "type": "Machining Center"},
    {"code": "HD2600Y", "type": "Machining Center"},
    {"code": "HD3100A", "type": "Machining Center"},
    {"code": "HD3100L", "type": "Machining Center"},
    {"code": "HD3100LM", "type": "Machining Center"},
    {"code": "HD3100LY", "type": "Machining Center"},
    {"code": "HD3100M", "type": "Machining Center"},
    {"code": "HD3100SY", "type": "Machining Center"},
    {"code": "HD3100SYA", "type": "Machining Center"},
    {"code": "HD3100Y", "type": "Machining Center"},
    {"code": "HD3100YA", "type": "Machining Center"},
    {"code": "HS6300 II", "type": "Machining Center"},
    {"code": "i-CUT400TD", "type": "Machining Center"},
    {"code": "KF3500/5A", "type": "Machining Center"},
    {"code": "KF4", "type": "Machining Center"},
    {"code": "KF4300D", "type": "Machining Center"},
    {"code": "KF5", "type": "Machining Center"},
    {"code": "KF5/50", "type": "Machining Center"},
    {"code": "KF5200D", "type": "Machining Center"},
    {"code": "KF5700B II", "type": "Machining Center"},
    {"code": "KF5700B/50 II", "type": "Machining Center"},
    {"code": "KF6", "type": "Machining Center"},
    {"code": "KF6/50", "type": "Machining Center"},
    {"code": "KF6000D", "type": "Machining Center"},
    {"code": "KF6700B II", "type": "Machining Center"},
    {"code": "KF7600L", "type": "Machining Center"},
    {"code": "KH1000", "type": "Machining Center"},
    {"code": "KIT4500", "type": "CNC Turning Center"},
    {"code": "KL7000LY", "type": "CNC Turning Center"},
    {"code": "L2000LSY", "type": "CNC Turning Center"},
    {"code": "L2000SY", "type": "CNC Turning Center"},
    {"code": "L2600LY", "type": "CNC Turning Center"},
    {"code": "L2600SY", "type": "CNC Turning Center"},
    {"code": "L2600Y", "type": "CNC Turning Center"},
    {"code": "L280LM", "type": "CNC Turning Center"},
    {"code": "L3000SY", "type": "CNC Turning Center"},
    {"code": "L300C", "type": "CNC Turning Center"},
    {"code": "L300LC", "type": "CNC Turning Center"},
    {"code": "L300MC", "type": "CNC Turning Center"},
    {"code": "L300MSC", "type": "CNC Turning Center"},
    {"code": "L4000L", "type": "CNC Turning Center"},
    {"code": "L4000LC", "type": "CNC Turning Center"},
    {"code": "L4000LM", "type": "CNC Turning Center"},
    {"code": "L4000LMC", "type": "CNC Turning Center"},
    {"code": "L4000MC", "type": "CNC Turning Center"},
    {"code": "L5100L", "type": "CNC Turning Center"},
    {"code": "L5100LY", "type": "CNC Turning Center"},
    {"code": "L700LMA", "type": "CNC Turning Center"},
    {"code": "LM1800TTSY", "type": "CNC Turning Center"},
    {"code": "LM2200TTSYY", "type": "CNC Turning Center"},
    {"code": "LM2200TTSYYC", "type": "CNC Turning Center"},
    {"code": "LV1100RM", "type": "CNC Turning Center"},
    {"code": "LV8500R", "type": "CNC Turning Center"},
    {"code": "LV8500RM", "type": "CNC Turning Center"},
    {"code": "SE2200", "type": "CNC Turning Center"},
    {"code": "SE2200A", "type": "CNC Turning Center"},
    {"code": "SE2200L", "type": "CNC Turning Center"},
    {"code": "SE2200LA", "type": "CNC Turning Center"},
    {"code": "SE2200LC", "type": "CNC Turning Center"},
    {"code": "SE2200LM", "type": "CNC Turning Center"},
    {"code": "SE2200LMA", "type": "CNC Turning Center"},
    {"code": "SE2200LMS", "type": "CNC Turning Center"},
    {"code": "SE2200LMSA", "type": "CNC Turning Center"},
    {"code": "SE2200LSY", "type": "CNC Turning Center"},
    {"code": "SE2200LY", "type": "CNC Turning Center"},
    {"code": "SE2200M", "type": "CNC Turning Center"},
    {"code": "SE2200MA", "type": "CNC Turning Center"},
    {"code": "SE2200Y", "type": "CNC Turning Center"},
    {"code": "SE2600", "type": "CNC Turning Center"},
    {"code": "SE2600L", "type": "CNC Turning Center"},
    {"code": "SE2600LM", "type": "CNC Turning Center"},
    {"code": "SE2600LSY", "type": "CNC Turning Center"},
    {"code": "SE2600LY", "type": "CNC Turning Center"},
    {"code": "SE2600M", "type": "CNC Turning Center"},
    {"code": "SE2600Y", "type": "CNC Turning Center"},
    {"code": "XM3100ST", "type": "Machining Center"},
    {"code": "KF6500/5A", "type": "Machining Center"},
    {"code": "KF7300/5A", "type": "Machining Center"},
    {"code": "HS6300II", "type": "Machining Center"},
    {"code": "HS8000II", "type": "Machining Center"}
]

def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # 1. Ensure categories exist
    category_map = {}
    unique_categories = set(item["type"] for item in models_data)
    
    for category_name in unique_categories:
        category = db.query(ProductCategory).filter(ProductCategory.name == category_name).first()
        if not category:
            category = ProductCategory(name=category_name)
            db.add(category)
            db.commit()
            db.refresh(category)
            print(f"Created category: {category.name}")
        else:
            print(f"Category already exists: {category.name}")
        category_map[category_name] = category.id
        
    added_count = 0
    updated_count = 0
    skipped_count = 0
    
    # 2. Add or update models
    # use dictionary to keep uniqueness while preserving last occurrence
    unique_models = {item["code"].strip(): item["type"] for item in models_data}
    
    for code, category_name in unique_models.items():
        if not code:
            continue
            
        category_id = category_map[category_name]
        existing_model = db.query(ProductModel).filter(ProductModel.model_code == code).first()
        
        if not existing_model:
            new_model = ProductModel(
                model_code=code,
                model_name=code,  # Setting name same as code
                category_id=category_id,
                is_active=True
            )
            db.add(new_model)
            added_count += 1
        else:
            if existing_model.category_id != category_id:
                existing_model.category_id = category_id
                updated_count += 1
            else:
                skipped_count += 1
            
    db.commit()
    print(f"Import completed. Added: {added_count}, Updated: {updated_count}, Skipped (unchanged): {skipped_count}")
    
    db.close()

if __name__ == "__main__":
    main()

