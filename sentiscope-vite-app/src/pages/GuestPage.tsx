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
  subreddit_name?: string;
}

interface PostsResponse {
  posts: {
    [key: string]: Post[];
  };
}

const GuestHomePage = () => {
  const [user] = useAuthState(auth);
  const [keyword, setKeyword] = useState(""); //Input keyword
  const [loading, setLoading] = useState(false); 
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);


  const handleSearch =  async (e: React.FormEvent) => {
    e.preventDefault();

    //Reset previous state
    setPosts([]);
    setError(null);
    setLoading(true);

    try{
      //Make API call to backend
      const response = await fetch(`http://127.0.0.1:5000/fetch?keyword=${encodeURIComponent(keyword)}&limit=50`);
      if(!response.ok){
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const data: PostsResponse = await response.json();
      //Process the response
      if(data.posts){
        const allPosts: Post[] = Object.entries(data.posts).flatMap(([subreddit, subredditPosts]) => {
          if(Array.isArray(subredditPosts)) {
          return subredditPosts.map(post => ({
            ...post,
            subreddit: post.subreddit_name
          }));
      } else {
        console.warn(`Invalid data for ${subreddit}: ${JSON.stringify(subredditPosts)}`)
        return [];
      }
      });
       setPosts(allPosts);
      } else if (data.message) {
        setError(data.message);
      }

    } catch(error) {
      setError (error instanceof Error ?  error.message : 'An error occurred while fetching posts');
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="guest-home-page">
      <h2>Welcome to Sentiscope</h2>
      <p>You have limited access as a guest. Please sign in to unlock full features.</p>

      {/* Disable search functionality for guests */}
      <form className="search-form" onSubmit={handleSearch}>
        <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Enter keyword" className="search-input" required/>
        <button type="submit" className="search-button" disabled={loading}>
          {loading ? "Loading..." : "Submit"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {posts.length > 0 && (
        <ul>
          {posts.map((post, index) => (
            <li key={index}>
              <strong>{post.title}</strong> (r/{post.subreddit_name}) - Score: {post.score}, Comments: {post.num_comments}
              <p>{post.text || "No text"}</p>
              <a href={post.url} target="_blank" rel="noopener noreferrer">Link</a>
            </li>
          ))}
        </ul>

      )}

      {/* Placeholder images for visual representation */}
      <div className="graphs">
        <img src="https://via.placeholder.com/600x400?text=Graph+1" alt="Graph 1" className="graph-image" />
        <img src="https://via.placeholder.com/600x400?text=Graph+2" alt="Graph 2" className="graph-image" />
      </div>
    </div>
  );
};

export default GuestHomePage;
