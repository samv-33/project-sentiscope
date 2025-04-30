import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate } from "react-router-dom";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
  addDoc,
  collection,
} from "firebase/firestore";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import 'd3-selection-multi';
import ReactWordcloud, { Word, Options } from 'react-wordcloud';



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
interface SummaryResponse {
  summary: string;
}

const HomePage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [sentiment, setSentiment] = useState<SentimentResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "sentiment" | "posts" | "summary" | "visualization"
  >("sentiment");

  const [showFeedback, setShowFeedback] = useState(false);
  const [fbType, setFbType] = useState("");
  const [fbDesc, setFbDesc] = useState("");
  const [fbError, setFbError] = useState("");
  const [fbSuccess, setFbSuccess] = useState("");

  const [timeFilter, setTimeFilter] = useState<
  "all" | "day" | "week" | "month" | "year"
  >("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const [showInstructions, setShowInstructions] = useState(true);


  const [user] = useAuthState(auth);

  // 2-hour cooldown visit tracking
  useEffect(() => {
    const trackVisit = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      try {
        const snap = await getDoc(userRef);
        const data = snap.exists() ? snap.data()! : {};
        const last = data.lastVisit?.toDate?.() || new Date(0);
        if (Date.now() - last.getTime() > 2 * 60 * 60 * 1000) {
          await setDoc(
            userRef,
            {
              visits: (data.visits || 0) + 1,
              lastVisit: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (e) {
        console.error("Visit tracking failed", e);
      }
    };
    trackVisit();
  }, [user]);

  if (!user) return <Navigate to="/" replace />;

  const handleFeedbackSubmit = async () => {
    setFbError("");
    setFbSuccess("");
    if (!fbType || !fbDesc.trim()) {
      setFbError("Please select a type and enter a description.");
      return;
    }
    try {
      await addDoc(collection(db, "feedback"), {
        uid: user.uid,
        category: fbType,
        description: fbDesc,
        timestamp: serverTimestamp(),
      });
      setFbSuccess("Thank you for your feedback!");
      setFbType("");
      setFbDesc("");
    } catch (e) {
      console.error(e);
      setFbError("Failed to send feedback. Please try again.");
    }
  };

  const handleAnalyze = async () => {
    setShowInstructions(false);
    setError(null);
    setPosts([]);
    setSentiment(null);
    setSummary(null);
    setLoading(true);
  
    try {
      const limit = 100; // max posts to fetch
      let mdlData: SentimentResponse;
      let allPosts: Post[] = [];
  
      if (timeFilter === "all") {
        // 1) Model prediction
        const mdlRes = await fetch("http://127.0.0.1:5001/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: [query] }),
        });
        if (!mdlRes.ok) throw new Error("Model prediction failed");
        mdlData = await mdlRes.json();
  
        // 2) Reddit fetch (limit=50)
        const rRes = await fetch(
          `http://127.0.0.1:5000/fetch?keyword=${encodeURIComponent(
            query
          )}&limit=50`
        );
        if (!rRes.ok) throw new Error("Failed to fetch Reddit posts");
        const rd = await rRes.json();
        allPosts = Object.entries(rd.posts || {}).flatMap(([sub, arr]) =>
          Array.isArray(arr)
            ? (arr as any[]).map((p) => ({ ...p, subreddit: sub }))
            : []
        );
      } else {
        // 2) Reddit fetch (limit=50 + time filter)
        const rRes = await fetch(
          `http://127.0.0.1:5000/fetch?keyword=${encodeURIComponent(
            query
          )}&limit=${limit}&filter=${timeFilter}`
        );
        if (!rRes.ok) throw new Error("Failed to fetch filtered Reddit posts");
        const rd = await rRes.json();
        allPosts = Object.entries(rd.posts || {}).flatMap(([sub, arr]) =>
          Array.isArray(arr)
            ? (arr as any[]).map((p) => ({ ...p, subreddit: sub }))
            : []
        );
  
        // 1) Model prediction (on fetched posts)
        const texts = allPosts.map((p) => p.text || p.title);
        const mdlRes = await fetch("http://127.0.0.1:5001/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts }),
        });
        if (!mdlRes.ok) throw new Error("Model prediction failed");
        mdlData = await mdlRes.json();
      }
  
      // 3) Summary call
      const sRes = await fetch("http://127.0.0.1:5000/generateSummary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: query,
          sentiment: mdlData,
          posts: allPosts,
        }),
      });
      if (!sRes.ok) throw new Error("Summary generation failed");
      const sData: SummaryResponse = await sRes.json();
  
      setSentiment(mdlData);
      setPosts(allPosts);
      setSummary(sData);
  
      // track usage
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { sentiments: increment(1) }).catch(() =>
        setDoc(userRef, { sentiments: 1 }, { merge: true })
      );
      const snap = await getDoc(userRef);
      const oldRec: string[] =
        snap.exists() && Array.isArray(snap.data().recent)
          ? snap.data().recent
          : [];
      await updateDoc(userRef, { recent: [query, ...oldRec] }).catch(() =>
        setDoc(userRef, { recent: [query] }, { merge: true })
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  

// // build a flat list of all words from posts
// const words = React.useMemo<Word[]>(() => {
//   const freq: Record<string, number> = {};
//   posts.forEach(p =>
//     p.text
//       .replace(/[^\w\s]/g, '')            // strip punctuation
//       .toLowerCase()
//       .split(/\s+/)
//       .filter(w => w.length > 3)          // drop tiny words
//       .forEach(w => (freq[w] = (freq[w] || 0) + 1))
//   );
//   return Object.entries(freq).map(([text, value]) => ({ text, value }));
// }, [posts]);

// const defaultOptions = (ReactWordcloud as any).defaultProps.options as Options;

// const options: Options = {
//   ...defaultOptions,
//   rotations:       2,
//   rotationAngles: [0, 90] as [number, number],
//   fontSizes:      [12, 50] as [number, number],
//   svgAttributes:  {},
// };


const formatDate = (timestamp: number) =>
  new Date(timestamp * 1000).toLocaleString();

  return (
    <div className="home-page">
      <h2>Search Sentiment Analysis</h2>

      {/* Feedback tab */}
      <div className="feedback-tab" onClick={() => setShowFeedback(true)}>
        Feedback
      </div>

      {/* Feedback modal */}
      {showFeedback && (
        <div className="feedback-modal">
          <div className="feedback-content">
            <h3>Send Feedback</h3>
            <label>Type:</label>
            <select value={fbType} onChange={e => setFbType(e.target.value)}>
              <option value="">-- Select --</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="general">General Feedback</option>
            </select>
            <label>Description:</label>
            <textarea
              value={fbDesc}
              onChange={e => setFbDesc(e.target.value)}
              rows={4}
            />
            {fbError && <p className="error-text">{fbError}</p>}
            {fbSuccess && <p className="success-text">{fbSuccess}</p>}
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button onClick={handleFeedbackSubmit}>Submit</button>
              <button onClick={() => setShowFeedback(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="search-form" style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Enter keyword or phrase"
          className="search-input"
        />
        <button
          onClick={handleAnalyze}
          className="search-button"
          disabled={loading || !query.trim()}
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      {/* ▼ Filter dropdown (rounded button + pop-up menu) ▼ */}
      <div className="filter-dropdown">
        <button
          className="filter-button dropdown-toggle"
          onClick={() => setFilterOpen(o => !o)}
        >
          {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}
          <span className="dropdown-arrow">{filterOpen ? "▲" : "▼"}</span>
        </button>
        {filterOpen && (
          <div className="filter-menu">
            {["all","day","week","month","year"].map(opt => (
              <div
                key={opt}
                className={`filter-menu-item ${timeFilter===opt?"active":""}`}
                onClick={() => {
                  setTimeFilter(opt as any);
                  setFilterOpen(false);
                }}
              >
                {opt.charAt(0).toUpperCase()+opt.slice(1)}
              </div>
            ))}
          </div>
        )}
      </div>

      {showInstructions && (
        <div className="instructions">
          <h2>Instructions: </h2>
          <p>
            To get started, choose a time filter if desired, enter a keyword/phrase for content you are interested
            in viewing then click "Analyze" to fetch posts from Reddit, view sentiment, and get a
            summary.
          </p>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {/* Tabs */}
      {(sentiment || posts.length > 0 || summary) && (
        <>
          <div className="home-tabs" style={{ marginTop: 20 }}>
            <button
              className={activeTab === "sentiment" ? "active" : ""}
              onClick={() => setActiveTab("sentiment")}
            >
              Sentiment Analysis
            </button>
            <button
              className={activeTab === "posts" ? "active" : ""}
              onClick={() => setActiveTab("posts")}
            >
              Fetched Posts ({posts.length})
            </button>
            <button
              className={activeTab === "summary" ? "active" : ""}
              onClick={() => setActiveTab("summary")}
            >
              Summary
            </button>
            <button
              className={activeTab === "visualization" ? "active" : ""}
              onClick={() => setActiveTab("visualization")}
            >
              Visualization
            </button>
          </div>

          <div className="home-pane" style={{ marginTop: 20 }}>
            {activeTab === "sentiment" && sentiment && (
              <div>
                <h3>Sentiment Analysis</h3>
                <p><strong>Sentiment:</strong> {sentiment.sentiment}</p>
                <p><strong>Positive %:</strong> {sentiment.positive_percentage}%</p>
                <p><strong>Negative %:</strong> {sentiment.negative_percentage}%</p>
              </div>
            )}

            {activeTab === "posts" && posts.length > 0 && (
              <div className="posts-container">
              <h3>Found {posts.length} posts</h3>
              <ul className="posts-list">
                {posts.map((post, index) => (
                  <li key={index} className="post-item">
                    <h4>{post.title}</h4>
                    <div className="post-meta">
                      <span>r/{post.subreddit}</span> – 
                      <span> Posted by u/{post.author}</span> – 
                      <span> {formatDate(post.created_utc)}</span>
                    </div>
                    <div className="post-stats">
                      <span>Score: {post.score}</span> – 
                      <span>Comments: {post.num_comments}</span> – 
                      <span>Upvote ratio: {(post.upvote_ratio * 100).toFixed(0)}%</span>
                      {post.is_video && <span> – Video</span>}
                    </div>
                    {post.text && (
                      <div className="post-text">
                        {post.text.length > 300
                          ? `${post.text.slice(0, 300)}…`
                          : post.text}
                      </div>
                    )}
                    <a href={post.url} target="_blank" rel="noopener noreferrer">
                      Link
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            )}

            {activeTab === "summary" && summary && (
              <div>
                <h3>AI Summary</h3>
                <p>{summary.summary}</p>
              </div>
            )}

            {activeTab === "visualization" && sentiment && (
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              {/* donut */}
              <div style={{ flex: 1, height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Positive', value: sentiment.positive_percentage },
                        { name: 'Other',    value: 100 - sentiment.positive_percentage },
                      ]}
                      dataKey="value"
                      innerRadius={70}
                      outerRadius={100}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {[ sentiment.positive_percentage, 100 - sentiment.positive_percentage ]
                        .map((v, i) =>
                          i === 0
                            ? <Cell key={i} fill={v > 70 ? '#28a745' : v >= 50 ? '#ffc107' : '#dc3545'} />
                            : <Cell key={i} fill="#e0e0e0" />
                        )
                      }
                    </Pie>
                    <Tooltip formatter={(val: number) => `${val.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

             {/* Word bubble */}
             <div style={{ flex: 1, height: 300 }}>
            {/* <ReactWordcloud
              words={words}
              options={options}
            /> */}
          </div>
            </div>
            )}

          </div> 
        </>
      )}
    </div>
  );
};

export default HomePage;
