# models.py
import mysql.connector

def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="yourpassword",
        database="yourdb"
    )

def insert_case(case_id, file_path):
    conn = get_connection()
    cursor = conn.cursor()

    query = """
    INSERT INTO cases (id, title, pdf_url)
    VALUES (%s, %s, %s)
    """

    cursor.execute(query, (case_id, "Uploaded Case", file_path))
    conn.commit()

    cursor.close()
    conn.close()
