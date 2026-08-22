from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import sqlite3
import os
from dotenv import load_dotenv

# .env 파일이 있으면 환경 변수로 로드합니다.
load_dotenv()

# 환경 변수에서 DATABASE_URL을 가져오고, 없으면 로컬 SQLite 경로를 기본값으로 사용합니다.
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./scm_erp.db")

# 1. 로컬 SQLite 환경일 경우에만 기존 파일 조작 및 수동 마이그레이션 스크립트를 실행합니다.
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    try:
        db_path = os.path.join(os.path.dirname(__file__), 'scm_erp.db')
        if os.path.exists(db_path):
            conn = sqlite3.connect(db_path)
            c = conn.cursor()
            c.execute("UPDATE orders SET current_status = 'SHIPPING' WHERE current_status = 'READY_FOR_SHIPPING'")
            c.execute("UPDATE order_status_history SET from_status = 'SHIPPING' WHERE from_status = 'READY_FOR_SHIPPING'")
            c.execute("UPDATE order_status_history SET to_status = 'SHIPPING' WHERE to_status = 'READY_FOR_SHIPPING'")
            
            # Migrate HWME to WME
            c.execute("UPDATE dealer_companies SET name = 'WME' WHERE name = 'HWME'")
            
            # Add new columns if they don't exist
            try:
                c.execute("ALTER TABLE orders ADD COLUMN destination_port VARCHAR")
            except sqlite3.OperationalError:
                pass # Column exists
                
            try:
                c.execute("ALTER TABLE orders ADD COLUMN price VARCHAR")
            except sqlite3.OperationalError:
                pass # Column exists
                
            conn.commit()
            conn.close()
    except Exception as e:
        pass

# PaaS 제공자(예: Heroku, Render)의 기본 주소가 postgres:// 로 시작할 경우 최신 SQLAlchemy(1.4+)를 위해 postgresql:// 로 변환
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 2. SQLite는 check_same_thread=False가 필요하지만, PostgreSQL 등은 필요 없습니다.
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
