import sqlite3

def check_db():
    conn = sqlite3.connect('scm_erp.db')
    cursor = conn.cursor()
    cursor.execute("SELECT username, email, password_hash, dealer_company_id FROM custom_users")
    users = cursor.fetchall()
    
    for u in users:
        if 'AK' in str(u[0]).upper():
            print(f"Found User: {u[0]}, Email: {u[1]}, Password: {u[2]}, DealerID: {u[3]}")
            
    conn.close()

if __name__ == "__main__":
    check_db()
