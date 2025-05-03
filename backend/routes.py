from flask import Flask, request, jsonify
import firestore_config
import reddit_config
import pickle
import numpy as np
import os
from dotenv import load_dotenv
from openai import OpenAI
import json
import requests

load_dotenv()
client = OpenAI()

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

            # Generate a custom token for the user
            custom_token = firestore_config.auth.create_custom_token(uid)


            # Store user data in Firestore
            user_ref = firestore_config.db.collection('users').document(str(uid))
            user_data = {
                "name": new_user["name"],
                "email": new_user["email"],
                "plan": new_user["plan"],
            } 
            user_ref.set(user_data)

            return jsonify({
                "message": "User signed up successfully!",
                "custom_token": custom_token.decode('utf-8') # Convert bytes to string
                            }), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400
        

    # endpoint for fetching data from Reddit API
    @app.route("/fetch", methods=['GET'])
    def fetch_post():
        try:
            keyword = request.args.get('keyword', '')
            limit = int(request.args.get('limit', 100))
            time_filter = request.args.get('filter', 'all')

            if not keyword:
                return jsonify({"error": "A valid keyword is required"}), 400

            try:
            #Search for keyword in posts directly
                posts_data = reddit_config.search_reddit_posts(keyword, limit, time_filter)

                # Process posts
                all_posts = {}
                for post in posts_data:
                    post_data = post["data"]
                    subreddit_name = post_data.get("subreddit", "Unknown")
                    

                    if subreddit_name not in all_posts:
                        all_posts[subreddit_name] = []

                    permalink = post_data.get("permalink", "")
                    full_reddit_url = f"https://www.reddit.com{permalink}" if permalink else post_data.get("url", "https://reddit.com")

                    all_posts[subreddit_name].append({
                        "title": post_data.get("title", "Untitled"),
                        "text": post_data.get("selftext", ""),
                        "score": post_data.get("score", 0),
                        "num_comments": post_data.get("num_comments", 0), 
                        "url": full_reddit_url,
                        "author": post_data.get("author", "Unknown"),
                        "created_utc": post_data.get("created_utc", 0),
                        "is_video": post_data.get("is_video", False),
                        "upvote_ratio": post_data.get("upvote_ratio", 0),
                        "subreddit": subreddit_name
                    })

                return jsonify({
                        "keyword": keyword,
                        "total_subreddits": len(all_posts),
                        "subreddits": list(all_posts.keys()),
                        "posts": all_posts
                    })
                
            except Exception as e:
                return jsonify({"error": f"Search failed: {str(e)}"}), 500
            
        except Exception as e:
            return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
        
    
    @app.route("/generateSummary", methods=["POST"])
    def generateSummary():
        try:
            data = request.get_json() or {}
            keyword = data.get("keyword", "").strip()
            sentiment_data = data.get("sentiment")
            posts = data.get("posts", [])

            if not keyword or not sentiment_data or not posts:
                return jsonify({"error": "Missing keyword, sentiment or posts"}), 400

            # Build a concise prompt
            summary_lines = [
                f"- “{p['text'][:100]}…” → {sentiment_data.get('sentiment')}"
                for p in posts[:5]
            ]
            prompt = (
                f"Summarize the overall sentiment trend for “{keyword}” "
                f"({sentiment_data['sentiment']} at "
                f"{sentiment_data.get('positive_percentage',0)}% positive) based on these posts:\n"
                + "\n".join(summary_lines) +
                "\nProvide a overview of the reddit posts and sentiment in no less than 100 words. Provide more detail no redunancy summarize post"
            )

            # Call ChatGPT once
            ai = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system",   "content": "You are a summarizer."},
                    {"role": "user",     "content": prompt}
                ],
                max_tokens=300,
                temperature=0.5
            )
            summary_text = ai.choices[0].message.content.strip()

            return jsonify({
                "keyword":  keyword,
                "summary":  summary_text
            })
        except Exception as e:
            app.logger.error("generateSummary error", exc_info=True)
            return jsonify({"error": str(e)}), 500
