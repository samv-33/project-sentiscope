from flask import Flask, request, jsonify
import firestore_config
import pickle
import numpy as np

# Load the model from the pickle file
with open("sentiscope_model.pkl", "rb") as model_file:
    model = pickle.load(model_file)

def init_routes(app):
    
    @app.route("/", methods=["GET"])
    def home():
        return jsonify({"message": "Welcome to Sentiscope!"})
    
    @app.route("/signup", methods=["POST"])
    def sign_up():
        try:
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

    # NEW API for Sentiment Analysis
    @app.route("/analyze", methods=["POST"])
    def analyze():
        try:
            data = request.get_json()
            keyword = data.get("keyword")
            if not keyword:
                return jsonify({"error": "Keyword is required"}), 400
            
            # Placeholder response for now
            response = {
                "keyword": keyword,
                "sentiment": "Neutral",
                "confidence": 0.85  # Placeholder value
            }
            return jsonify(response)
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    # API for Sentiment Analysis
    # Search should narrow down what data gets fed in before this is invoked
    # Then this should return the sentiment of the data once finished
    # use_model() is the function that does the actual sentiment analysis (not uploaded yet)
    # use_model() has the updated text processing to remove usernames, URLs, numbers, and stop words, and punctuation
    # Started unit testing for use_model() on 3/20, will continue to work on it
    @app.route('/classify', methods=['POST'])
    def classify():
        try:
            data = request.get_json()
            features = np.array(data['features']).reshape(1, -1)
            classification = model.use_model(features)
            #TODO: rework this as needed
            return jsonify({'output': classification.tolist()})    
        except Exception as e:
            return jsonify({'error': str(e)}), 400