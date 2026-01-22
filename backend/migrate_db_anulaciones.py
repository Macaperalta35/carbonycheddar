import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'carbo_cheddar_new.db')

def migrate():
    print(f"Migrando base de datos en: {DB_PATH}")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Añadir columna 'anulada' a 'ventas'
    try:
        cursor.execute("ALTER TABLE ventas ADD COLUMN anulada BOOLEAN DEFAULT 0")
        print("✓ Columna 'anulada' añadida a tabla 'ventas'")
    except sqlite3.OperationalError as e:
        if 'duplicate column name' in str(e):
            print("⚠ Columna 'anulada' ya existe en 'ventas'")
        else:
            print(f"x Error añadiendo columna 'anulada': {e}")

    # 2. Crear tabla 'mermas_ingredientes'
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS mermas_ingredientes (
        id INTEGER PRIMARY KEY,
        ingrediente_id INTEGER NOT NULL,
        cantidad FLOAT NOT NULL,
        razon VARCHAR(255),
        usuario_id INTEGER,
        created_at DATETIME,
        FOREIGN KEY(ingrediente_id) REFERENCES ingredientes(id),
        FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
    );
    """
    try:
        cursor.execute(create_table_sql)
        print("✓ Tabla 'mermas_ingredientes' creada/verificada")
    except Exception as e:
        print(f"x Error creando tabla 'mermas_ingredientes': {e}")
        
    conn.commit()
    conn.close()
    print("Migración completada.")

if __name__ == '__main__':
    migrate()
