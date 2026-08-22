import sys
import os
import json

# add backend path to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
from models import ProductCategory, ProductModel

with open('new_models.json', 'r', encoding='utf-8') as f:
    models_data = json.load(f)

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
