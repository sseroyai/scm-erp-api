from database import engine, SessionLocal, Base
from models import PortCode

ports_data = [
    {"port_code": "Hamburg", "country": "Germany"},
    {"port_code": "Istanbul", "country": "Turkey"},
    {"port_code": "Le Havre", "country": "France"},
    {"port_code": "Rijeka", "country": "Croatia"},
    {"port_code": "Rotterdam", "country": "Netherlands"},
    {"port_code": "Oslo", "country": "Norway"},
    {"port_code": "Barcelona", "country": "Spain"},
    {"port_code": "Napoli", "country": "Italy"},
]

def import_ports():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for item in ports_data:
            existing = db.query(PortCode).filter(PortCode.port_code == item["port_code"]).first()
            if not existing:
                port = PortCode(port_code=item["port_code"], country=item["country"])
                db.add(port)
            else:
                existing.country = item["country"]
        db.commit()
        print("Ports successfully imported to the database.")
    except Exception as e:
        print(f"Error importing Ports: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_ports()
