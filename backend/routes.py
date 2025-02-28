from flask import Flask, request, jsonify
import firestore_config


def init_routes(app):
    
  @app.route("/", methods=["GET"])
  def home():
        return jsonify({"message":"Welcome to Sentiscope!"})
    
  @app.route("/signup", methods=["POST"])
  def sign_up():
            try:
                #Get json data from request
                new_user = request.get_json()

                if not all(key in new_user for key in ["name", "email", "password", "plan"]):
                     return jsonify({"error": "Missing required fields"}), 400
                
                try: 
                     user = firestore_config.auth.create_user(
                          email=new_user["email"],
                          password=new_user["password"]
                     )
                except Exception as e:
                     return jsonify({"error": str(e)}), 500
                
                uid = user.uid
        
                #Get the user's UID and add it to Firestore
                user_ref = firestore_config.db.collection('users').document(str(uid))

                user_data = {
                     "name": new_user["name"],
                     "email": new_user["email"],
                     "plan": "free"
                     } 
                            
                user_ref.set(user_data)

                return jsonify({"message": "User signed up successfully!"}), 201
            except Exception as e:
                return jsonify({"error": str(e)}), 400

    