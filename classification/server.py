from flask import Flask, request, jsonify
import pickle
import numpy as np
import re
import string
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

nltk.download('stopwords')
nltk.download('wordnet')

app = Flask(__name__)

with open("sentiscope.pkl", "rb") as model_file:
    LRmodel = pickle.load(model_file)

with open("vectoriser.pkl", "rb") as vec_file:
    vectorizer = pickle.load(vec_file)

def clean_text(text):
    text = text.lower()
    text = re.sub('r/[^\s]+', '', text)
    text = re.sub('https?://[^\s]+', '', text)
    text = re.sub('[0-9]+', '', text)
    text = "".join([char for char in text if char not in string.punctuation])
    return text

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    if not data or 'texts' not in data:
        return jsonify({'error': 'No text provided'}), 400

    text = data['text']
    if not isinstance(text, list) or len(text) == 0:
        return jsonify({'error': 'Invalid input format.'}), 400
    
    cleaned_text = [clean_text(text) for text in text]
    vectorized_texts = vectorizer.transform(clean_text)

    predictions = LRmodel.predict(vectorized_texts)

    total = len(predict)
    positive_count = sum(predictions)
    negative_count = total - positive_count

    positive_percentage = (positive_count / total ) * 100
    negative_percentage = (negative_count / total) * 100

    return jsonify({
        'total posts' : total,
        'positive percentage' : round(positive_percentage, 2),
        'negative percentage' : round(negative_percentage, 2)
    })
if __name__ == "__main__":

    app.run(host="0.0.0.0", port=5000, debug=True)