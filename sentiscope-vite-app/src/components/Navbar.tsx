// src/components/Navbar.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

const Navbar = ({ user }: { user: any }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async () => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError("No account found. Please sign up.");
    }
  };

  const handleSignUp = async () => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError("Sign up failed.");
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">SENTISCOPE</Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>

        {user ? (
          <div className="profile-dropdown">
            <button onClick={() => setProfileDropdown(!profileDropdown)} className="navbar-link">
              Profile ▼
            </button>
            {profileDropdown && (
              <div className="dropdown-menu">
                <button onClick={() => navigate("/settings")} className="dropdown-item">
                  Settings
                </button>
                <button onClick={handleSignOut} className="dropdown-item">
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-dropdown">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="navbar-link">
              Sign In
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button onClick={handleSignIn} className="dropdown-item">Login</button>
                <button onClick={handleSignUp} className="dropdown-item">Sign Up</button>
                {error && <p className="error-text">{error}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
