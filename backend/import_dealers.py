import sys
import os

# add backend path to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
from models import DealerCompany, CustomUser, Order

dealers_data = [
    {"name": "WME", "country": "WIA"},
    {"name": "AK MAKINA", "country": "Turkiye"},
    {"name": "ARO-TEC", "country": "Germany"},
    {"name": "ATON", "country": "Bulgaria"},
    {"name": "BREMBO", "country": "Poland"},
    {"name": "CNC MECHANICS", "country": "Unknown"},
    {"name": "CNC RESITVE", "country": "Unknown"},
    {"name": "DEMTEK", "country": "Serbia"},
    {"name": "FEDAROM", "country": "Romania"},
    {"name": "GMP", "country": "Spain"},
    {"name": "LICHRON", "country": "Sweden"},
    {"name": "M+E", "country": "Hungary"},
    {"name": "MACHINEMATCH", "country": "Netherlands"},
    {"name": "MACHINERY", "country": "Finland"},
    {"name": "MTI", "country": "Poland"},
    {"name": "MUGGLER", "country": "Denmark"},
    {"name": "NAGEL", "country": "Germany"},
    {"name": "NEWEMAG", "country": "Switzerland"},
    {"name": "PABACHKE", "country": "Norway"},
    {"name": "PROFIKA", "country": "Czechia"},
    {"name": "REPMO", "country": "France"},
    {"name": "VENTEN", "country": "Estonia"},
    {"name": "VIMACCHINE", "country": "Italy"},
    {"name": "WECO", "country": "Germany"}
]

dealers_to_delete = [
    "TechMachinery GmbH",
    "Alpha Precision S.R.L.",
    "Nordic Tooling AB",
    "EuroLathe Polska Sp. z o.o.",
    "Iberia CNC Solutions"
]

def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # 1. Delete old dealers and their associated users and orders to avoid foreign key constraint errors
    print("Deleting old seed dealers...")
    for d_name in dealers_to_delete:
        dealer = db.query(DealerCompany).filter(DealerCompany.name == d_name).first()
        if dealer:
            # Delete associated users
            users = db.query(CustomUser).filter(CustomUser.dealer_company_id == dealer.id).all()
            for u in users:
                db.delete(u)
            
            # Delete associated orders
            orders = db.query(Order).filter(Order.dealer_company_id == dealer.id).all()
            for o in orders:
                db.delete(o)
                
            # Now delete the dealer
            db.delete(dealer)
            print(f"Deleted: {d_name}")
            
    db.commit()
    
    # 2. Add or update new dealers
    print("Inserting/Updating actual dealers...")
    added_count = 0
    updated_count = 0
    
    for d in dealers_data:
        existing = db.query(DealerCompany).filter(DealerCompany.name == d["name"]).first()
        if not existing:
            new_dealer = DealerCompany(
                name=d["name"],
                country=d["country"],
                region="Europe" # Default region
            )
            db.add(new_dealer)
            added_count += 1
        else:
            existing.country = d["country"]
            updated_count += 1
            
    db.commit()
    print(f"Dealer update completed. Added: {added_count}, Updated: {updated_count}")
    
    db.close()

if __name__ == "__main__":
    main()
