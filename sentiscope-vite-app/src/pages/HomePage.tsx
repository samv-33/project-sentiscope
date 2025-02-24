// src/pages/HomePage.tsx
import React, { useState } from "react";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate } from "react-router-dom";

const HomePage = () => {
  const [query, setQuery] = useState("");
  const [user] = useAuthState(auth);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // for handling search query
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted Query:", query);
  };

  return (
    <div className="home-page">
      <h2>Search Sentiment Analysis</h2>
      <form onSubmit={handleSubmit} className="search-form">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter keyword or hashtag" className="search-input" />
        <button type="submit" className="search-button">Submit</button>
      </form>
      <div className="graphs">
        <img src="https://via.placeholder.com/600x400?text=Graph+1" alt="Graph 1" className="graph-image" />
        <img src="https://via.placeholder.com/600x400?text=Graph+2" alt="Graph 2" className="graph-image" />
      </div>
    </div>
  );
};

export default HomePage;
