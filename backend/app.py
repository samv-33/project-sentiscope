from flask import Flask, request, jsonify
from firestore_config import db
from routes import init_routes
from flask_cors import CORS
import string
import re

#nltk libraries for text cleaning functions
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer, WordNetLemmatizer


def create_app():
    app = Flask(__name__)
    CORS(app)
    init_routes(app)
    return app

#Text cleaning functions
#Just applied using lambda functions, such as:
#data['text'] = data['text'].apply(lambda x: cleaning_URLs(x))
def cleaning_URLs(data):
    return re.sub('((www\.[^\s]+)|(https?://[^\s]+))',' ',data)

def cleaning_numbers(data):
    return re.sub('[0-9]+', '', data)

def cleaning_punctuations(text):
    english_punctuations = string.punctuation
    punctuations_list = english_punctuations
    translator = str.maketrans('', '', punctuations_list)
    return text.translate(translator)

def stemming_on_text(data):
    st = nltk.PorterStemmer()
    text = [st.stem(word) for word in data]
    return data

def lemmatizer_on_text(data):
    lm = nltk.WordNetLemmatizer()
    text = [lm.lemmatize(word) for word in data]
    return data

def remove_reddit_usernames(post):
    post = re.sub('u/[^\s]+','',post)
    post = re.sub('r/[^\s]+', '',post)
    return post

with open("sentiscope_model.pkl", "rb") as model_file:
    model = pickle.load(model_file)

@app.route('/classify', methods=['POST'])
def classify():
    #Boilerplate request, will likely be removed or changed to something else!
    #TODO: Implement a request method lol
    try:
        data = request.get_json()
        data['text'] = data['text'].apply(lambda x: cleaning_URLs(x))
        data['text'] = data['text'].apply(lambda x: cleaning_numbers(x))
        data['text'] = data['text'].apply(lambda x: cleaning_punctuations(x))
        data['text'] = data['text'].apply(lambda x: remove_reddit_usernames(x))
        data['text'] = data['text'].apply(lambda x: word_tokenize(x))
        data['text'] = data['text'].apply(lambda x: stemming_on_text(x))
        data['text'] = data['text'].apply(lambda x: lemmatizer_on_text(x))
        classification = model.classify(data['text'])
        return jsonify(classification.tolist())    
    except Exception as e:
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
