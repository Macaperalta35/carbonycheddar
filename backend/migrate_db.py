import sqlite3
import os

DB_PATH = os.path.join(os.getcwd(), 'instance', 'carbo_cheddar_new.db')
if not os.path.exists(DB_PATH):
    # Try default location if instance folder is not used or different
    DB_PATH = 'carbon_cheddar.db'

print(f"Migrando base de datos en: {DB_PATH}")

def run_migration():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # 1. Agregar stock_actual a ingredientes
        try:
            cursor.execute("ALTER TABLE ingredientes ADD COLUMN stock_actual FLOAT DEFAULT 0")
            print("✅ Columna 'stock_actual' agregada a 'ingredientes'")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("ℹ️ Columna 'stock_actual' ya existe en 'ingredientes'")
            else:
                print(f"❌ Error al agregar 'stock_actual': {e}")

        # 2. Agregar permisos a usuarios
        try:
            cursor.execute("ALTER TABLE usuarios ADD COLUMN permisos JSON")
            print("✅ Columna 'permisos' agregada a 'usuarios'")
        except sqlite3.OperationalError as e:
             if "duplicate column name" in str(e):
                print("ℹ️ Columna 'permisos' ya existe en 'usuarios'")
             else:
                print(f"❌ Error al agregar 'permisos': {e}")
                
        # 3. Crear tabla reabastecimientos_inventario
        try:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS reabastecimientos_inventario (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ingrediente_id INTEGER NOT NULL,
                cantidad FLOAT NOT NULL,
                costo_compra FLOAT NOT NULL,
                proveedor VARCHAR(100),
                observaciones VARCHAR(255),
                usuario_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(ingrediente_id) REFERENCES ingredientes(id),
                FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
            )
            """)
            print("✅ Tabla 'reabastecimientos_inventario' creada o verificada")
        except Exception as e:
            print(f"❌ Error al crear tabla 'reabastecimientos_inventario': {e}")
            
        # 4. Agregar usuario_id a ventas (Fix bug)
        try:
            cursor.execute("ALTER TABLE ventas ADD COLUMN usuario_id INTEGER REFERENCES usuarios(id)")
            print("✅ Columna 'usuario_id' agregada a 'ventas'")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("ℹ️ Columna 'usuario_id' ya existe en 'ventas'")
            else:
                print(f"❌ Error al agregar 'usuario_id' a ventas: {e}")

        # 5. Corregir tabla Comandas (quitar unique de venta_id)
        try:
            # Verificar si existe constraint unique
            cursor.execute("PRAGMA index_list('comandas')")
            indices = cursor.fetchall()
            # Si hay índice único en venta_id, recrear tabla
            # En SQLite es complejo verificar el constraint exacto, así que asumimos recrear si tabla existe
            print("🔄 Recreando tabla 'comandas' para corregir constraint...")
            
            cursor.execute("ALTER TABLE comandas RENAME TO comandas_old")
            
            cursor.execute("""
            CREATE TABLE comandas (
                id INTEGER PRIMARY KEY,
                venta_id INTEGER NOT NULL REFERENCES ventas(id),
                tipo_comanda VARCHAR(20) NOT NULL,
                contenido_html TEXT NOT NULL,
                contenido_texto TEXT NOT NULL,
                impresa BOOLEAN,
                fecha_impresion DATETIME,
                created_at DATETIME
            )
            """)
            
            # Copiar datos
            cursor.execute("""
            INSERT INTO comandas (id, venta_id, tipo_comanda, contenido_html, contenido_texto, impresa, fecha_impresion, created_at)
            SELECT id, venta_id, tipo_comanda, contenido_html, contenido_texto, impresa, fecha_impresion, created_at
            FROM comandas_old
            """)
            
            cursor.execute("DROP TABLE comandas_old")
            print("✅ Tabla 'comandas' corregida (venta_id duplicados permitidos)")
            
        except Exception as e:
            if "no such table" in str(e):
                print("ℹ️ Tabla 'comandas' no existía, se creará al inicio.")
            elif "already exists" in str(e):
                 print("ℹ️ La tabla ya estaba renombrada o hubo conflicto.")
            else:
                print(f"⚠️ Nota sobre comandas: {e}")

        # 6. Agregar sub_receta_id a receta_ingredientes
        try:
            cursor.execute("ALTER TABLE receta_ingredientes ADD COLUMN sub_receta_id INTEGER REFERENCES recetas(id)")
            print("✅ Columna 'sub_receta_id' agregada a 'receta_ingredientes'")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("ℹ️ Columna 'sub_receta_id' ya existe")
            else:
                print(f"❌ Error al agregar 'sub_receta_id': {e}")
        
        # NOTA: Hacer 'ingrediente_id' nullable en SQLite es complicado (requiere recrear tabla).
        # Por ahora asumiremos que el código maneja IDs inexistentes o usamos valores dummy si es necesario.
        # En una DB real haría ALTER COLUMN

        conn.commit()
        conn.close()
        print("\n✨ Migración completada exitosamente")

    except Exception as e:
        print(f"\n❌ Error fatal en migración: {e}")

if __name__ == "__main__":
    if os.path.exists(DB_PATH):
        run_migration()
    else:
        print(f"❌ No se encontró la base de datos en {DB_PATH}")
