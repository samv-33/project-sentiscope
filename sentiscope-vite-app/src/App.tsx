import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { User } from "firebase/auth";
import { auth } from "./firebase";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import SettingsPage from "./pages/SettingsPage";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import "./assets/App.css";

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="app">
      <Navbar />
      <div className="content">
        <Routes>
          <Route path="/" element={user ? <HomePage /> : <Navigate to="/signup" />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/signin" />} />
          <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />
          <Route path="/signin" element={!user ? <SignIn /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
