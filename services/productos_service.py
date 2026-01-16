from database import get_db

def listar_productos():
    db = get_db()
    return [dict(p) for p in db.execute("SELECT * FROM productos")]

def crear_producto(nombre, precio, costo):
    db = get_db()
    db.execute(
        "INSERT INTO productos (nombre, precio, costo) VALUES (?, ?, ?)",
        (nombre, precio, costo)
    )
    db.commit()
