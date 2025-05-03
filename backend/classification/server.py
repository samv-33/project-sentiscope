import os
import pickle
import numpy as np
import re
import string
import nltk
from nltk import WordNetLemmatizer, PorterStemmer
from flask import Blueprint, request, jsonify

# Download necessary NLTK data
nltk.download('stopwords')
nltk.download('wordnet')

# Load stopwords
stop_words = set(nltk.corpus.stopwords.words('english'))

# Resolve absolute paths to the model files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VECTORIZER_PATH = os.path.join(BASE_DIR, "vectoriser.pkl")
MODEL_PATH = os.path.join(BASE_DIR, "sentiscope.pkl")

# Load the TF-IDF vectorizer and logistic regression model
with open(VECTORIZER_PATH, "rb") as f:
    vectorizer = pickle.load(f)
with open(MODEL_PATH, "rb") as f:
    LRmodel = pickle.load(f)

def clean_text(text: str) -> str:
    try:
        text = text.lower()
        text = re.sub(r"/[^\s]+", "", text)
        text = re.sub(r"https?://[^\s]+", "", text)
        text = re.sub(r"\d+", "", text)
        text = text.translate(str.maketrans("", "", string.punctuation))
        words = [w for w in text.split() if w not in stop_words]
        lemmatizer = WordNetLemmatizer()
        stemmer = PorterStemmer()
        # First lemmatize, then stem
        words = [stemmer.stem(lemmatizer.lemmatize(w)) for w in words]
        return " ".join(words).strip()
    except Exception as e:
        print(f"Error in clean_text: {e}")
        return ""

model_bp = Blueprint("model", __name__)

@model_bp.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json() or {}
        texts = data.get("texts")
        if not isinstance(texts, list) or len(texts) == 0:
            return jsonify({"error": "Invalid input format."}), 400

        # Clean and filter
        cleaned_texts = [clean_text(t) for t in texts if isinstance(t, str)]
        cleaned_texts = [t for t in cleaned_texts if t]
        if not cleaned_texts:
            return jsonify({"error": "No valid text after cleaning."}), 400

        # Vectorize and predict probabilities
        X = vectorizer.transform(cleaned_texts)
        probs = LRmodel.predict_proba(X)

        # Compute mean positive/negative percentages
        positive_pct = np.mean([p[1] for p in probs]) * 100
        negative_pct = np.mean([p[0] for p in probs]) * 100
        sentiment = "Positive" if positive_pct > negative_pct else "Negative"

        return jsonify({
            "sentiment": sentiment,
            "positive_percentage": round(positive_pct, 2),
            "negative_percentage": round(negative_pct, 2)
        })
    except Exception as e:
        print(f"Error in predict: {e}")
        return jsonify({"error": "An error occurred during prediction."}), 500
