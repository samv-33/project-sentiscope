// src/pages/HomePage.tsx
import React, { useState } from "react";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate } from "react-router-dom";

// Basic sentiment structure (from /analyze)
interface BasicResponse {
  keyword: string;
  sentiment: string;
  confidence: number;
}

// Summary structure (from /generateSummary)
interface SummaryResponse {
  keyword: string;
  sentiment: {
    sentiment: string;
    confidence: number;
  };
  posts: Array<{
    title: string;
    text: string;
    subreddit: string;
    score: number;
  }>;
  summary: string;
}

const HomePage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [basic, setBasic] = useState<BasicResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loadingBasic, setLoadingBasic] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAuthState(auth);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const fetchBasic = async () => {
    setError(null);
    setBasic(null);
    setSummary(null);
    setLoadingBasic(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: query }),
      });
      if (!res.ok) throw new Error("Failed to fetch basic sentiment");
      const data: BasicResponse = await res.json();
      setBasic(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingBasic(false);
    }
  };

  const fetchSummary = async () => {
    setError(null);
    setBasic(null);
    setSummary(null);
    setLoadingSummary(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/generateSummary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: query }),
      });
      if (!res.ok) throw new Error("Failed to fetch summary");
      const data: SummaryResponse = await res.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className="home-page">
      <h2>Search Sentiment Analysis</h2>

      <div className="search-form" style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter keyword or hashtag"
          className="search-input"
        />
        <button
          onClick={fetchBasic}
          className="search-button"
          disabled={loadingBasic || loadingSummary}
        >
          {loadingBasic ? "Analyzing…" : "Get Sentiment"}
        </button>
        <button
          onClick={fetchSummary}
          className="search-button"
          disabled={loadingBasic || loadingSummary}
        >
          {loadingSummary ? "Generating…" : "Get Summary"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {basic && (
        <div className="result" style={{ marginTop: "1.5rem" }}>
          <h3>Basic Sentiment</h3>
          <p><strong>Keyword:</strong> {basic.keyword}</p>
          <p><strong>Sentiment:</strong> {basic.sentiment}</p>
          <p><strong>Confidence:</strong> {Math.round(basic.confidence * 100)}%</p>
        </div>
      )}

      {summary && (
        <div className="result" style={{ marginTop: "1.5rem" }}>
          <h3>Advanced Summary</h3>
          <p><strong>Keyword:</strong> {summary.keyword}</p>
          <p><strong>Overall Sentiment:</strong> {summary.sentiment.sentiment}</p>
          <p><strong>Confidence:</strong> {Math.round(summary.sentiment.confidence * 100)}%</p>
          <p style={{ marginTop: "1rem" }}><strong>Summary:</strong> {summary.summary}</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
