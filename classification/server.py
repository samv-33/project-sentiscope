from flask import Flask, request, jsonify
import pickle
import numpy as np

app = Flask(__name__)

with open("sentiscope.pkl", "rb") as model_file:
    model = pickle.load(model_file)

@app.route("/classify", methods=["POST"])
def classify():
    try:
        data = request.get_json()
        features = np.array(data["features"]).reshape(1, -1)
        classification = model.classify(features)
        return jsonify({'output': classification.tolist()})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)