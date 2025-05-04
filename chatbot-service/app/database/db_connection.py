import os
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import pooling
from contextlib import contextmanager

load_dotenv()

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USERNAME'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME'),
    'pool_name': 'mypool',
    'pool_size': 5
}

# Create connection pool
connection_pool = mysql.connector.pooling.MySQLConnectionPool(**DB_CONFIG)

@contextmanager
def get_db_connection():
    """
    Context manager for database connections.
    Automatically handles connection acquisition and release.

    Usage:
        with get_db_connection() as conn:
            with conn.cursor(dictionary=True) as cursor:
                cursor.execute("SELECT * FROM table")
                results = cursor.fetchall()

    Returns:
        mysql.connector.connection.MySQLConnection: Database connection from the pool
    """
    conn = connection_pool.get_connection()
    try:
        yield conn
    except Exception as e:
        conn.rollback()
        raise e
    else:
        conn.commit()
    finally:
        conn.close()

def init_database():
    """
    Initialize the database by creating all necessary tables
    """
    # Read the schema file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    schema_path = os.path.join(current_dir, 'schema.sql')

    try:
        with open(schema_path, 'r') as f:
            schema_sql = f.read()

        # Split into individual statements
        statements = schema_sql.split(';')

        # Execute each statement
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                for statement in statements:
                    if statement.strip():
                        cursor.execute(statement)

        print("Database initialized successfully")

    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        raise