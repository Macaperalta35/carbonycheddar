from flask import Flask
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from routes.auth_routes import auth_bp
from routes.productos_routes import productos_bp
from routes.ventas_routes import ventas_bp

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "carbon-secret-key"

JWTManager(app)
Bcrypt(app)

app.register_blueprint(auth_bp)
app.register_blueprint(productos_bp)
app.register_blueprint(ventas_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
