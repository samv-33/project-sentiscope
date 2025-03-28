from flask import Flask, request, jsonify
from firestore_config import db
from routes import init_routes
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)
    init_routes(app)
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
