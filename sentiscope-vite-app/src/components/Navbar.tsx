//src/components/Navbar.tsx
import { useState, useEffect, useRef} from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";


const Navbar = ({ user }: { user: any }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const navigate = useNavigate();

  // Create refs for dropdown elements
  const authDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Clear credentials when dropdown closes
  useEffect(() => {
    if (!dropdownOpen) {
      setError(null);
    }
  }, [dropdownOpen]);

  // Reset credentials when user changes
  useEffect(() => {
    // Clear fields when user logs in
    if (user) {
      resetCredentials();
    }
  }, [user]);


  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside of auth dropdown
      if (authDropdownRef.current && !authDropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      // Check if click is outside of profile dropdown
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const resetCredentials = () => {
    setEmail("");
    setPassword("");
    setError(null);
  };

  const handleSignIn = async () => {
    setError(null);
    try {

      await signInWithEmailAndPassword(auth, email, password);
      resetCredentials(); // Clear credentials after successful sign-in
    } catch (error) {
      setError("No account found. Please sign up.");
      console.log("Error signing in:", error);
    }
  };

  const handleSignUp = async () => {
      navigate("/signup");
  }

  const handleSignOut = async () => {
    await signOut(auth);
    resetCredentials(); // Clear credentials after sign-out
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
          <div className={`profile-dropdown ${profileDropdown ? 'open' : ''}`} ref={profileDropdownRef}>
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
          <div className={`auth-dropdown ${dropdownOpen ? 'open' : ''}`} ref={authDropdownRef}>
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
