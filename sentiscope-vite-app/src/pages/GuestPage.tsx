// src/pages/GuestHomePage.tsx
import React, { useState } from "react";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate, Link} from "react-router-dom";

interface Post {
  title: string;
  text: string;
  score: number;
  num_comments: number;
  url: string;
  author: string;
  created_utc: number;
  is_video: boolean;
  upvote_ratio: number;
  subreddit: string;
}

interface SentimentResponse {
  sentiment: string;
  positive_percentage: number;
  negative_percentage: number;
}

const formatDate = (ts: number) =>
  new Date(ts * 1000).toLocaleString();

const GuestHomePage: React.FC = () => {
  const [user] = useAuthState(auth);
  // only signed-out users see this page
  if (user) return <Navigate to="/home" replace />;

  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [sentiment, setSentiment] = useState<SentimentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "sentiment" | "posts" | "summary" | "visualization"
  >("sentiment");

  const [timeFilter, setTimeFilter] = useState<
    "all" | "day" | "week" | "month" | "year"
  >("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const [showInstructions, setShowInstructions] = useState(true);

  const handleAnalyze = async () => {
    setShowInstructions(false);
    setError(null);
    setPosts([]);
    setSentiment(null);
    setLoading(true);

    try {
      const limit = 15;
      let mdlData: SentimentResponse;
      let fetchedPosts: Post[] = [];

      if (timeFilter === "all") {
        // 1) Model prediction on the keyword
        {
          const mdlRes = await fetch("http://127.0.0.1:5001/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texts: [keyword] }),
          });
          if (!mdlRes.ok) throw new Error("Model prediction failed");
          mdlData = await mdlRes.json();
        }
        // 2) Fetch latest 15 Reddit posts for display
        {
          const rRes = await fetch(
            `http://127.0.0.1:5000/fetch?keyword=${encodeURIComponent(
              keyword
            )}&limit=${limit}`
          );
          if (!rRes.ok) throw new Error("Failed to fetch Reddit posts");
          const rd = await rRes.json();
          fetchedPosts = Object.entries(rd.posts || {}).flatMap(
            ([sub, arr]) =>
              Array.isArray(arr)
                ? (arr as any[]).map((p) => ({ ...p, subreddit: sub }))
                : []
          );
        }
      } else {
        // 2) Fetch filtered 15 posts
        {
          const rRes = await fetch(
            `http://127.0.0.1:5000/fetch?keyword=${encodeURIComponent(
              keyword
            )}&limit=${limit}&filter=${timeFilter}`
          );
          if (!rRes.ok)
            throw new Error("Failed to fetch filtered Reddit posts");
          const rd = await rRes.json();
          fetchedPosts = Object.entries(rd.posts || {}).flatMap(
            ([sub, arr]) =>
              Array.isArray(arr)
                ? (arr as any[]).map((p) => ({ ...p, subreddit: sub }))
                : []
          );
        }
        // 1) Model prediction on fetched posts
        {
          const texts = fetchedPosts.map((p) => p.text || p.title);
          const mdlRes = await fetch("http://127.0.0.1:5001/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texts }),
          });
          if (!mdlRes.ok) throw new Error("Model prediction failed");
          mdlData = await mdlRes.json();
        }
      }

      setSentiment(mdlData);
      setPosts(fetchedPosts);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <h2>Welcome to Sentiscope</h2>
      <p>
        You have limited access as a guest. Please{" "}
        <Link to="/signup" style={{ color: "#007bff", textDecoration: "underline" }}>
        sign up
        </Link>{" "}
        to unlock full features.
      </p>

      {/* Search bar + Analyze */}
      <div className="search-form" style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter keyword or phrase"
          className="search-input"
        />
        <button
          onClick={handleAnalyze}
          className="search-button"
          disabled={loading || !keyword.trim()}
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      {/* Filter dropdown */}
      <div className="filter-dropdown">
        <button
          className="filter-button dropdown-toggle"
          onClick={() => setFilterOpen((o) => !o)}
        >
          {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}
          <span className="dropdown-arrow">{filterOpen ? "▲" : "▼"}</span>
        </button>
        {filterOpen && (
          <div className="filter-menu">
            {["all", "day", "week", "month", "year"].map((opt) => (
              <div
                key={opt}
                className={`filter-menu-item ${
                  timeFilter === opt ? "active" : ""
                }`}
                onClick={() => {
                  setTimeFilter(opt as any);
                  setFilterOpen(false);
                }}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      {showInstructions && (
        <div className="instructions">
          <h2>Instructions:</h2>
          <p>
            To get started, choose a time filter if desired, enter a keyword/phrase for content you are interested
            in viewing then click "Analyze" to fetch posts from Reddit, view sentiment, and get a
            summary.
          </p>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {/* Tabs */}
      {(sentiment || posts.length > 0) && (
        <>
          <div className="home-tabs" style={{ marginTop: 20 }}>
            <button
              className={activeTab === "sentiment" ? "active" : ""}
              onClick={() => setActiveTab("sentiment")}
            >
              Sentiment
            </button>
            <button
              className={activeTab === "posts" ? "active" : ""}
              onClick={() => setActiveTab("posts")}
            >
              Posts ({posts.length})
            </button>
            <button
              className={activeTab === "summary" ? "active" : ""}
              disabled
              title="Create an account to view"
            >
              Summary
            </button>
            <button
              className={activeTab === "visualization" ? "active" : ""}
              disabled
              title="Create an account to view"
            >
              Visualization
            </button>
          </div>

          <div className="home-pane" style={{ marginTop: 20 }}>
            {activeTab === "sentiment" && sentiment && (
              <div>
                <h3>Sentiment Analysis</h3>
                <p>
                  <strong>Sentiment:</strong> {sentiment.sentiment}
                </p>
                <p>
                  <strong>Positive %:</strong>{" "}
                  {sentiment.positive_percentage}%
                </p>
                <p>
                  <strong>Negative %:</strong>{" "}
                  {sentiment.negative_percentage}%
                </p>
              </div>
            )}

            {activeTab === "posts" && posts.length > 0 && (
              <div className="posts-container">
                <h3>Found {posts.length} posts</h3>
                <ul className="posts-list">
                  {posts.map((post, i) => (
                    <li key={i} className="post-item">
                      <h4>{post.title}</h4>
                      <div className="post-meta">
                        <span>r/{post.subreddit}</span> –{" "}
                        <span>u/{post.author}</span> –{" "}
                        <span>{formatDate(post.created_utc)}</span>
                      </div>
                      <div className="post-stats">
                        <span>Score: {post.score}</span> –{" "}
                        <span>Comments: {post.num_comments}</span> –{" "}
                        <span>
                          Upvotes: {(post.upvote_ratio * 100).toFixed(0)}%
                        </span>
                        {post.is_video && <span> – Video</span>}
                      </div>
                      {post.text && (
                        <div className="post-text">
                          {post.text.length > 300
                            ? `${post.text.slice(0, 300)}…`
                            : post.text}
                        </div>
                      )}
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Link
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === "summary" && (
              <div>
                <p>Create an account to view summaries.</p>
              </div>
            )}

            {activeTab === "visualization" && (
              <div>
                <p>Create an account to view visualizations.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GuestHomePage;
