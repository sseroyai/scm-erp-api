import sqlite3
import os

db_path = r'g:\+++JUN project+++\STOCK Manager ERP\scm_erp_system\backend\scm_erp.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("UPDATE email_notification_configs SET interval_days = 10 WHERE stage = 'SHIPPING_INTERVAL'")
conn.commit()
conn.close()
print("DB updated successfully")
