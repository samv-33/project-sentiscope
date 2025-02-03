// src/pages/HomePage.tsx
import React, { useState } from 'react';

const HomePage = () => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle the sentiment analysis submission logic here
    console.log("Submitted Query:", query);
  };

  return (
    <div className="home-page">
      <h2>
        Please enter a Keyword or Hashtag of your choice to perform a Sentiment Analysis.
      </h2>
      <form onSubmit={handleSubmit} className="search-form">
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Enter keyword or hashtag"
          className="search-input"
        />
        <button type="submit" className="search-button">Submit</button>
      </form>
    </div>
  );
};

export default HomePage;
