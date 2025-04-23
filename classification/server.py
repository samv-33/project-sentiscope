from flask import Flask, request, jsonify
import pickle
import numpy as np
import re
import string
import nltk
#from nltk import WordNetLemmatizer
#from nltk import PorterStemmer
#import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from flask_cors import CORS


nltk.download('stopwords')
nltk.download('wordnet')

#vectorizer_path = os.path.join(os.path.dirname(__file__), "vectoriser.pkl")
#model_path = os.path.join(os.path.dirname(__file__), "sentiscope.pkl")

app = Flask(__name__)
CORS(app)

with open("sentiscope.pkl", "rb") as model_file:
    LRmodel = pickle.load(model_file)

with open("vectoriser.pkl", "rb") as vec_file:
    vectorizer = pickle.load(vec_file)
#with open(model_path, "rb") as model_file:
#    LRmodel = pickle.load(model_file)
#
#with open(vectorizer_path, "rb") as vec_file:
#    vectorizer = pickle.load(vec_file)
#
#print(f"Vectorizer vocabulary size: {len(vectorizer.vocabulary_) if hasattr(vectorizer, 'vocabulary_') else 'Not fitted!'}")
#print(f"Vectorizer has idf_: {hasattr(vectorizer, 'idf_')}")

def clean_text(text):
    text = text.lower()
    text = re.sub(r'r/[^\s]+', '', text)
    text = re.sub(r'https?://[^\s]+', '', text)
    text = re.sub(r'[0-9]+', '', text)
    text = "".join([char for char in text if char not in string.punctuation])
    return text

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    #if not data or 'texts' not in data:
    #    return jsonify({'error': 'No text provided'}), 400
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400

    #text = data['text']
    #if not isinstance(text, list) or len(text) == 0:
    #    return jsonify({'error': 'Invalid input format.'}), 400

    text = data['text']
    if not isinstance(text, str): 
        return jsonify({'error': 'Invalid input format.'}), 400 
    
    #cleaned_text = [clean_text(text) for text in text]
    #vectorized_texts = vectorizer.transform(clean_text)

    cleaned_text = clean_text(text)
    vectorized_text = vectorizer.transform([cleaned_text])
    prediction = LRmodel.predict(vectorized_text)[0]

    sentiment = "Positive" if prediction == 1 else "Negative"
    #confidence = LRmodel.predict_proba(vectorized_text)[0][prediction]
    probabilities = LRmodel.predict_proba(vectorized_text)[0]
    positive_percentage = probabilities[1] * 100
    negative_percentage = probabilities[0] * 100
    #total = len(predict)
    #positive_count = sum(predictions)
    #negative_count = total - positive_count
#
    #positive_percentage = (positive_count / total ) * 100
    #negative_percentage = (negative_count / total) * 100

    #return jsonify({
    #    'total posts' : total,
    #    'positive percentage' : round(positive_percentage, 2),
    #    'negative percentage' : round(negative_percentage, 2)
    #})

    #return jsonify({
    #    'sentiment': sentiment,
    #    'confidence': round(confidence * 100, 2)
    #})

    
    return jsonify({
        'sentiment': sentiment,
        'positive_percentage': round(positive_percentage, 2),
        'negative_percentage': round(negative_percentage, 2)
    })

if __name__ == "__main__":

    app.run(host="0.0.0.0", port=5001, debug=True)