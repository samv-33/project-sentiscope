// src/pages/HomePage.tsx
import React, { useState } from 'react';

const HomePage = () => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle the sentiment analysis submission logic here
    console.log("Submitted Query:", query);
  };

  // For now, manually set the weekly sentiment
  const weeklySentiment = "Cats";

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

      {/* Display the weekly sentiment */}
      <div className="weekly-sentiment">
        <h3>This week's sentiment: {weeklySentiment}</h3>
      </div>

      {/* Placeholder images for graphs */}
      <div className="graphs">
        <img 
          src="https://via.placeholder.com/600x400?text=Graph+1" 
          alt="Graph 1" 
          className="graph-image"
        />
        <img 
          src="https://via.placeholder.com/600x400?text=Graph+2" 
          alt="Graph 2" 
          className="graph-image"
        />
      </div>
    </div>
  );
};

export default HomePage;
