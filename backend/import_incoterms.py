from database import engine, SessionLocal, Base
from models import IncotermCode

incoterms_data = [
    {"incoterm_code": "FCA", "description": "Free Carrier"},
    {"incoterm_code": "CIF", "description": "Cost, Insurance and Freight"},
    {"incoterm_code": "CFR", "description": "Cost and Freight"},
    {"incoterm_code": "FOB", "description": "Free On Board"},
    {"incoterm_code": "EXW", "description": "EX Works"},
    {"incoterm_code": "CPT", "description": "Carriage Paid to"},
    {"incoterm_code": "CIP", "description": "Carriage and Insurance Paid to"},
    {"incoterm_code": "DAP", "description": "Delivered at Place"},
    {"incoterm_code": "DPU", "description": "Delivered Place Unloaded"},
    {"incoterm_code": "DDP", "description": "Delivered Duty Paid"},
]

def import_incoterms():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for item in incoterms_data:
            existing = db.query(IncotermCode).filter(IncotermCode.incoterm_code == item["incoterm_code"]).first()
            if not existing:
                incoterm = IncotermCode(incoterm_code=item["incoterm_code"], description=item["description"])
                db.add(incoterm)
            else:
                existing.description = item["description"]
        db.commit()
        print("Incoterms successfully imported to the database.")
    except Exception as e:
        print(f"Error importing Incoterms: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_incoterms()
