import os
from dotenv import load_dotenv
import requests
import time
import json
from redis_config import redis_client

load_dotenv()

reddit_client_id = os.getenv('REDDIT_CLIENT_ID')
reddit_secret_key = os.getenv('REDDIT_SECRET_KEY')
reddit_user_agent = os.getenv('USER_AGENT')

# Cache expiration time (in seconds, e.g., 10 minutes)
CACHE_TTL = 600

# Global variable to store access tokens and its expiration
access_token = None
token_expiry = None

def get_access_token():
    global access_token, token_expiry
    url = "https://www.reddit.com/api/v1/access_token"
    headers = {"User-Agent": reddit_user_agent}

    data = {
        "grant_type": "client_credentials",
        "scope": "read"
    }

    auth = (reddit_client_id, reddit_secret_key)

    response = requests.post(url, headers=headers, data=data, auth=auth)
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data["access_token"]

        token_expiry = int(token_data["expires_in"]) + int(time.time())
        return access_token
    else:
        raise Exception(f"Failed to get access token: {response.text}")
    
def token_validity_check():
    global access_token, token_expiry
    current_time = int(time.time())

    if not access_token or (token_expiry and current_time >= token_expiry):
        return get_access_token()
    return access_token

def cache_get(key):
    """Retrieve data from Redis cache."""
    cached_data = redis_client.get(key)
    if cached_data:
        return json.loads(cached_data)
    return None

def cache_set(key, data):
    """Store data in Redis cache with TTL."""
    redis_client.setex(key, CACHE_TTL, json.dumps(data))

def fetch_subreddit_posts(subreddit_name, limit=50):
    token = token_validity_check()
    url = f"https://oauth.reddit.com/r/{subreddit_name}/hot?limit={limit}"
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": reddit_user_agent
    }

    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()["data"]["children"]
    else:
        # Improved error handling
        error_detail = f"Status Code: {response.status_code}"
        try:
            error_json = response.json()
            error_detail += f", Response: {error_json}"

        except:
            error_detail += f", Response text: {response.text}"
        raise Exception(f"Failed to fetch posts: {response.text}")
    
def search_subreddits(keyword):
    token = token_validity_check()
    url = f"https://oauth.reddit.com/api/subreddit_autocomplete_v2?query={keyword}&limit=10" 
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": reddit_user_agent
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        subreddits = []
        for sub in response.json()["data"]["children"]:
            subreddits.append({
                "id": sub["data"]["name"],
                "display_name": sub["data"]["display_name"]
            })
        return subreddits
    else:
        error_detail = f"Status Code: {response.status_code}"
        try:
            error_json = response.json()
            error_detail += f", Response: {error_json}"

        except:
            error_detail += f", Response text: {response.text}"
        raise Exception(f"Subreddit search failed: {response.text}")
    
def search_reddit_posts(keyword, limit=50):
    # Generate a unique cache key
    cache_key = f"reddit_search:{keyword}:{limit}"

    # Check cache first
    cache_posts = cache_get(cache_key)
    if cache_posts:
        return cache_posts
    
    token = token_validity_check()
    url = f"https://oauth.reddit.com/search?q={keyword}&limit={limit}&sort=relevance"
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": reddit_user_agent
    }

    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        posts =  response.json()["data"]["children"]
        # Cache the result
        cache_set(cache_key, posts)
        return posts
    else:
        error_detail = f"Status Code: {response.status_code}"
        try:
            error_json = response.json()
            error_detail += f", Response: {error_json}"

        except:
            error_detail += f", Response text: {response.text}"
        raise Exception(f"Failed to search posts: {response.text}")

