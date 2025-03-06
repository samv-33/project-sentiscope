import React, { useState } from "react";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate } from "react-router-dom";

const HomePage = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<{ keyword: string; sentiment: string; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAuthState(auth);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword: query }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch sentiment analysis.");
      }

      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <h2>Search Sentiment Analysis</h2>
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter keyword or hashtag"
          className="search-input"
        />
        <button type="submit" className="search-button" disabled={loading}>
          {loading ? "Analyzing..." : "Submit"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {response && (
        <div className="result">
          <h3>Analysis Result</h3>
          <p><strong>Keyword:</strong> {response.keyword}</p>
          <p><strong>Sentiment:</strong> {response.sentiment}</p>
          <p><strong>Confidence:</strong> {response.confidence * 100}%</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
