from flask_bcrypt import Bcrypt
from database import get_db

bcrypt = Bcrypt()

def crear_usuario(username, password, rol="admin"):
    hash_pw = bcrypt.generate_password_hash(password).decode("utf-8")
    db = get_db()
    db.execute(
        "INSERT INTO usuarios (username, password_hash, rol) VALUES (?, ?, ?)",
        (username, hash_pw, rol)
    )
    db.commit()

def autenticar(username, password):
    db = get_db()
    user = db.execute(
        "SELECT * FROM usuarios WHERE username = ?", (username,)
    ).fetchone()
    if user and bcrypt.check_password_hash(user["password_hash"], password):
        return dict(user)
    return None
