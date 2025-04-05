from flask import Flask, request, jsonify
import pickle
import numpy as np
import re
import string
import nltk
from nltk import WordNetLemmatizer
from nltk import PorterStemmer
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

nltk.download('stopwords')
nltk.download('wordnet')

vectorizer_path = os.path.join(os.path.dirname(__file__), "vectoriser.pkl")
model_path = os.path.join(os.path.dirname(__file__), "sentiscope.pkl")

app = Flask(__name__)

with open(model_path, "rb") as model_file:
    LRmodel = pickle.load(model_file)

with open(vectorizer_path, "rb") as vec_file:
    vectorizer = pickle.load(vec_file)

print(f"Vectorizer vocabulary size: {len(vectorizer.vocabulary_) if hasattr(vectorizer, 'vocabulary_') else 'Not fitted!'}")
print(f"Vectorizer has idf_: {hasattr(vectorizer, 'idf_')}")

def clean_text(text):
    try:
        text = re.sub(r'/[^\s]+', '', text)
        text = re.sub(r'https?://[^\s]+', '', text)
        text = re.sub(r'[0-9]+', '', text)
        text = "".join([char for char in text if char not in string.punctuation])
        stemmer = PorterStemmer()
        lemmatizer = WordNetLemmatizer()
        words = [lemmatizer.lemmatize(word) for word in text.split()]
        words = [stemmer.stem(word) for word in words]
        return " ".join(words).strip()
    except Exception as e:
        print(f"Error in clean_text: {e}")
        return "" 

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        if not data or 'texts' not in data:
            return jsonify({'error': 'No text provided. Line 32.'}), 400

        text = data['texts']
        if not isinstance(text, list) or len(text) == 0:
            return jsonify({'error': 'Invalid input format.'}), 400

        cleaned_text = [clean_text(item) for item in text if isinstance(item, str)]
        cleaned_text = [item for item in cleaned_text if item] 
        vectorized_texts = vectorizer.transform(cleaned_text)

        predictions = LRmodel.predict(vectorized_texts)

        total = len(predictions)
        positive_count = np.sum(predictions)
        negative_count = total - positive_count

        positive_percentage = (positive_count / total ) * 100
        negative_percentage = (negative_count / total) * 100

        return jsonify({
            'total posts' : total,
            'positive percentage' : round(positive_percentage, 2),
            'negative percentage' : round(negative_percentage, 2)
        })

    except Exception as e:
        print(f"Error in predict: {e}")
        return jsonify({'error': 'An error occurred during prediction.'}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)