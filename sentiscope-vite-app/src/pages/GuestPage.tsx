// src/pages/GuestHomePage.tsx
import React, { useState } from "react";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

interface Post{
  title: string;
  text: string;
  score: number;
  num_comments: number;
  url: string;
  subreddit: string;
  author: string;
  created_utc: number;  
  is_video: boolean;
  upvote_ratio: number;
}

interface PostsResponse {
  keyword: string;
  total_subreddits: number;
  subreddits: string[];
  posts: {
    [subreddit: string]: Post[];
  };
  message?: string;
}

interface SentimentResponse {
  sentiment: string;
  positive_percentage: number;
  negative_percentage: number;
  //confidence: number;
}

const GuestHomePage = () => {
  const [user] = useAuthState(auth);
  const [keyword, setKeyword] = useState(""); //Input keyword
  const [loading, setLoading] = useState(false); 
  const [posts, setPosts] = useState<Post[]>([]);
  const [sentiment, setSentiment] = useState<SentimentResponse | null>(null); //Sentiment analysis result
  const [error, setError] = useState<string | null>(null);

  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };


  const handleSearch =  async (e: React.FormEvent) => {
    e.preventDefault();

    //Reset previous state
    setPosts([]);
    setError(null);
    setLoading(true);

    try{
      //Make API call to backend with limit=10 for guest users
      const response = await fetch(`http://127.0.0.1:5000/fetch?keyword=${encodeURIComponent(keyword)}&limit=10`);

      if(!response.ok){
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const data: PostsResponse = await response.json();
      console.log("API Response:", data); //Log the response for debugging

      //Process the response
      if(data.posts && Object.keys(data.posts).length > 0){
        const allPosts: Post[] = Object.entries(data.posts).flatMap(([subreddit, subredditPosts]) => {
          if(Array.isArray(subredditPosts)) {
          return subredditPosts.map(post => ({
            ...post,
            subreddit: post.subreddit || subreddit
          }));
      } else {
        console.warn(`Invalid data for ${subreddit}: ${JSON.stringify(subredditPosts)}`)
        return [];
      }
      });

      console.log("Processed posts:", allPosts); //Log the processed posts for debugging
      setPosts(allPosts);
      } else if (data.message) {
        setError(data.message);
      } else {
        setError("No posts found for the given keyword.");
      }
    } catch(error) {
      setError (error instanceof Error ?  error.message : 'An error occurred while fetching posts');
      } finally {
        setLoading(false);
      }
  };

  // New function for sentiment analysis
  const handleSentimentAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setSentiment(null);
    setError(null);
    setLoading(true);

  try{
    const response = await fetch("http://127.0.0.1:5001/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: [keyword] }), // Use keyword as input for simplicity // changed from { text: keyword }

    });
    if(!response.ok){
      throw new Error(`Sentiment analysis failed: ${response.statusText}`);
    }
    const data: SentimentResponse = await response.json();
    setSentiment(data);
  } catch(error) {
    setError(error instanceof Error ? error.message : "An error occurred during sentiment analysis");
  } finally {
    setLoading(false);
   }
  };

  return (
    <div className="guest-home-page">
      <h2>Welcome to Sentiscope</h2>
      <p>You have limited access as a guest. Please sign up if you haven't yet to unlock full features.<br></br>
      To login, press the "Sign In" button at the top right corner and you will see a small menu.<br></br>
      Type in your credentials and press Login.
      To Sign up, simply press the "Sign Up" option and you should be redirected to the Sign Up page.</p>

      {/* Disable search functionality for guests */}
      <form className="search-form" onSubmit={handleSearch}>
        <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Enter keyword" className="search-input" required/>
        <button type="submit" className="search-button" disabled={loading}>
          {loading ? "Loading..." : "Submit"}
        </button>
        <button type="button" onClick={handleSentimentAnalysis} className="sentiment-button" disabled={loading}>
          {loading ? "Loading..." : "Analyze Sentiment"}
        </button>
      </form>

      <div className="instructions">
        <h2>Instructions: </h2>
        <p>To get started, enter a keyword for content you are interested in viewing the sentiment about.</p>
        <p>Click "Submit" to fetch posts from Reddit.</p>
        <p>Click "Analyze Sentiment" to analyze the sentiment of the keyword.</p>
        <p>The Sentiment Analysis Results will return at the bottom.</p>
      </div>

      {error && <p className="error">{error}</p>}

      {posts.length > 0 && (
      <div className="posts-container">
        <h3>Found {posts.length} posts</h3>
        <ul className="posts-list">
          {posts.map((post, index) => (
            <li key={index} className="post-item">
              <h4>{post.title}</h4>
              <div className="post-meta">
                <span>r/{post.subreddit}</span> - 
                <span> Posted by u/{post.author}</span>
                <span> {formatDate(post.created_utc)}</span>
        </div>
        <div className="post-stats">
         <span>Score: {post.score}</span> - 
         <span> Comments: {post.num_comments}</span> -
         <span> Upvote ratio: {(post.upvote_ratio * 100).toFixed(0)}%</span>
         {post.is_video && <span> - Video</span>}
        </div>
          {post.text && (
            <div className="post-text">
              {post.text.length > 300
              ? `${post.text.slice(0, 300)}...`
              : post.text}
              </div>
              )}
              <a href={post.url} target="_blank" rel="noopener noreferrer">Link</a>
            </li>
          ))}
        </ul>
        </div>
      )}

      {sentiment && (
        <div className="sentiment-result">
          <h3>Sentiment Analysis Result</h3>
          <p>Sentiment: {sentiment.sentiment}</p>
          {/*<p>Confidence: {sentiment.confidence}%</p>*/}
          <p>Positive Percentage: {sentiment.positive_percentage}%</p>
          <p>Negative Percentage: {sentiment.negative_percentage}%</p>
        </div>
      )}

      

      {/* Placeholder images for visual representation */}
      {posts.length > 0 && (
      <div className="graphs">
        <img src="https://via.placeholder.com/600x400?text=Graph+1" alt="Graph 1" className="graph-image" />
        <img src="https://via.placeholder.com/600x400?text=Graph+2" alt="Graph 2" className="graph-image" />
      </div>
      )}
    </div>
  );
};

export default GuestHomePage;
