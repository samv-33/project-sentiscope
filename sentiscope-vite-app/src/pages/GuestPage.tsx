// src/pages/GuestHomePage.tsx
import React from "react";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const GuestHomePage = () => {
  const [user] = useAuthState(auth);

  return (
    <div className="guest-home-page">
      <h2>Welcome to Sentiscope</h2>
      <p>You have limited access as a guest. Please sign in to unlock full features.</p>

      {/* Disable search functionality for guests */}
      <form className="search-form">
        <input type="text" placeholder="Enter keyword or hashtag" className="search-input" disabled />
        <button type="submit" className="search-button" disabled>
          Submit
        </button>
      </form>

      {/* Placeholder images for visual representation */}
      <div className="graphs">
        <img src="https://via.placeholder.com/600x400?text=Graph+1" alt="Graph 1" className="graph-image" />
        <img src="https://via.placeholder.com/600x400?text=Graph+2" alt="Graph 2" className="graph-image" />
      </div>
    </div>
  );
};

export default GuestHomePage;
