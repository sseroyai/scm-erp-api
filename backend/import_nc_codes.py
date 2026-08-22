from database import engine, SessionLocal, Base
from models import NCCode

nc_data = [
    {"nc_code": "F0iP", "description": "FANUC 0i-F Plus"},
    {"nc_code": "F30P", "description": "FANUC 30i-B Plus"},
    {"nc_code": "F31P", "description": "FANUC 31i-B Plus"},
    {"nc_code": "F32P", "description": "FANUC 32i-B Plus"},
    {"nc_code": "F3EP", "description": "FANUC 500i-A"},
    {"nc_code": "S828D", "description": "SIEMENS 828D"},
    {"nc_code": "S840D", "description": "SIEMENS 840D"},
    {"nc_code": "SONE", "description": "SIEMENS ONE"},
    {"nc_code": "H640", "description": "HH TNC 640"},
    {"nc_code": "H7", "description": "HH TNC7"},
]

def import_nc_codes():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for item in nc_data:
            existing = db.query(NCCode).filter(NCCode.nc_code == item["nc_code"]).first()
            if not existing:
                nc = NCCode(nc_code=item["nc_code"], description=item["description"])
                db.add(nc)
            else:
                existing.description = item["description"]
        db.commit()
        print("NC codes successfully imported to the database.")
    except Exception as e:
        print(f"Error importing NC codes: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_nc_codes()
