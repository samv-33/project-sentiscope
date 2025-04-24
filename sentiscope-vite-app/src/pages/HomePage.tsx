// src/pages/HomePage.tsx
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
} from "firebase/firestore";

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

  // Track home page visits with 2-hour cooldown
  useEffect(() => {
    const trackVisit = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      try {
        const snap = await getDoc(userRef);
        const data = snap.exists() ? snap.data()! : {};
        const lastVisit = data.lastVisit?.toDate?.() || new Date(0);
        const now = new Date();
        if (now.getTime() - lastVisit.getTime() > 2 * 60 * 60 * 1000) {
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

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const fetchBasic = async () => {
    setError(null);
    setBasic(null);
    setSummary(null);
    setLoadingBasic(true);

    try {
      // 1) call backend
      const res = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: query }),
      });
      if (!res.ok) throw new Error("Failed to fetch basic sentiment");
      const data: BasicResponse = await res.json();
      setBasic(data);

      // 2) update Firestore: increment sentiments & push to recent[]
      const userRef = doc(db, "users", user.uid);

      // a) increment sentiments counter
      try {
        await updateDoc(userRef, {
          sentiments: increment(1),
        });
      } catch (e) {
        // if field missing, merge-create
        await setDoc(
          userRef,
          { sentiments: 1 },
          { merge: true }
        );
      }

      // b) push into recent array
      try {
        const snap = await getDoc(userRef);
        const oldRecent: string[] = snap.exists() && Array.isArray(snap.data().recent)
          ? (snap.data().recent as string[])
          : [];

        const newRecent = [query, ...oldRecent];
        await updateDoc(userRef, { recent: newRecent });
      } catch (e) {
        // if field missing, create it
        await setDoc(
          userRef,
          { recent: [query] },
          { merge: true }
        );
      }
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
