from flask import Flask
from flask_cors import CORS

from routes import init_routes
from classification.server import model_bp

def create_app():
    app = Flask(__name__)
    CORS(app)

    init_routes(app)
    app.register_blueprint(model_bp)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host="0.0.0.0", port=5000)
