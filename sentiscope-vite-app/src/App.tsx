// src/App.tsx
import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import GuestPage from "./pages/GuestPage";
import SignUpPage from "./pages/SignUpPage";
import AboutPage from "./pages/AboutPage";
import SettingsPage from "./pages/SettingsPage";

import "./assets/App.css";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="app">
      <Navbar user={user} />
      <div className="content">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/home" replace /> : <GuestPage />} />
          <Route path="/signup" element={user ? <Navigate to="/home" replace /> : <SignUpPage/>} />
          <Route path="/home" element={user ? <HomePage /> : <Navigate to="/" replace />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
