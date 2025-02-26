from flask import Flask, request, jsonify
from firestore_config import db


def init_routes(app):
    
  @app.route("/", methods=["GET"])
  def home():
        return jsonify({"message":"Welcome to Sentiscope!"})
    
  @app.route("/signup", methods=["POST"])
  def sign_up():
            try:
                new_user = request.json
                user_ref = db.collection('users').document(new_user['id']).set({
                    'name': new_user.get('name'),
                    'email': new_user.get('email'),
                    'plan': new_user.get('plan')
                })
                return jsonify({"message": "User signed up successfully!"}), 201
            except Exception as e:
                return jsonify({"error": str(e)}), 400

    