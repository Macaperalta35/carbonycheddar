from database import get_db
from datetime import datetime

def registrar_venta(producto_id, cantidad, cliente, mesa):
    db = get_db()
    ahora = datetime.now()
    db.execute(
        "INSERT INTO ventas (producto_id, cantidad, cliente, mesa, fecha, hora) VALUES (?, ?, ?, ?, ?, ?)",
        (producto_id, cantidad, cliente, mesa,
         ahora.strftime("%Y-%m-%d"),
         ahora.strftime("%H:%M:%S"))
    )
    db.commit()
