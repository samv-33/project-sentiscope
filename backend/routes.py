from flask import Flask, request, jsonify
import firestore_config
import reddit_config
import pickle
import numpy as np

##Load the model from the pickle file
#with open("sentiscope_model.pkl", "rb") as model_file:
#    model = pickle.load(model_file)

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
        

    # endpoint for fetching data from Reddit API
    @app.route("/fetch", methods=['GET'])
    def fetch_post():
        try:
            keyword = request.args.get('keyword', '')
            limit = int(request.args.get('limit', 50))

            if not keyword:
                return jsonify({"error": "A valid keyword is required"}), 400

            try:
            #Search for keyword in posts directly
                posts_data = reddit_config.search_reddit_posts(keyword, limit)

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
            
            

           #     match_subreddits = reddit_config.search_subreddits(keyword)
           # except Exception as e:
           #     return jsonify({"error": f"Subreddit search failed: {str(e)}"}), 500
#
           # if not match_subreddits:
           #     return jsonify({
           #         "message": f"No subreddits found for the keyword: {keyword}",
           #         "posts": {}
           #     }), 404
           


            #all_posts = {}
            #for subreddit_info in match_subreddits:
            #    subreddit_id = subreddit_info["id"]
            #    subreddit_name = subreddit_info["display_name"]
            #    try:
            #        posts_data = reddit_config.fetch_subreddit_posts(subreddit_name, limit)
            #        posts = []
#
            #        for post in posts_data:
            #            post_data = post["data"]
#
            #            # Extract permalink to create full reddit URL
            #            permalink = post_data.get("permalink", "")
            #            full_reddit_url = f"https://www.reddit.com{permalink}" if permalink else post_data.get("url", "https://reddit.com")
#
#
            #            # Extract post details according to Reddit JSON structure
            #            posts.append({
            #                "title": post_data.get("title", "Untitled"),
            #                "text": post_data.get("selftext", ""),
            #                "score": post_data.get("score", 0),
            #                "num_comments": post_data.get("num_comments", 0), 
            #                "url": full_reddit_url,
            #                "author": post_data.get("author", "Unknown"),
            #                "created_utc": post_data.get("created_utc", 0),
            #                "is_video": post_data.get("is_video", False),
            #                "upvote_ratio": post_data.get("upvote_ratio", 0),
            #                "subreddit": subreddit_name
            #            })
#
            #        # Store posts under the readable subreddit name    
                    #all_posts[subreddit_name] = posts

                #except Exception as e:
                #    all_posts[subreddit_name] = []
                #    print(f"Error for {subreddit_name}: {str(e)}")

            #return jsonify({
            #    "keyword": keyword,
            #    "total_subreddits": len(match_subreddits),
            #    "subreddits": [sub["display_name"] for sub in match_subreddits],
            #    "posts": all_posts
            #})
        except Exception as e:
            return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
        
    

