from flask import Flask, request, jsonify
from firestore_config import db
from routes import init_routes
from flask_cors import CORS
import string
import re

#Following code is for text cleaning and classification of the text using #nltk libraries.
#Leaving commented out for now as it is not being used and I don't wanna break anything lol
#nltk libraries.
#import nltk
#from nltk.tokenize import word_tokenize
#from nltk.corpus import stopwords
#from nltk.stem import PorterStemmer, WordNetLemmatizer


def create_app():
    app = Flask(__name__)
    CORS(app)
    init_routes(app)
    return app

#Text cleaning functions
#Keeping commented out so the Flask app works for now lol
#Just applied using lambda functions, such as:
#data['text'] = data['text'].apply(lambda x: cleaning_URLs(x))
'''def cleaning_URLs(data):
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
#classification call
#@app.route('/', methods=['POST'])
'''


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)