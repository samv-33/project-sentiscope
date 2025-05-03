import os
from flask import Flask
from flask_cors import CORS
from firestore_config import db
from routes import init_routes
from classification.server import model_bp

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Simple health check
    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"}), 200

    init_routes(app)

    app.register_blueprint(model_bp)

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
