// src/pages/SignUpPage.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithCustomToken, onAuthStateChanged} from "firebase/auth";

const API_BASE = "https://project-sentiscope.onrender.com";


const SignUpPage = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null); 
    const [successMessage, setSuccessMessage] = useState<string | null>(null); // New state for success message
    const [isLoading, setIsLoading] = useState(false); // Loading state
    const navigate  = useNavigate();
    const plan = "free"; // Default plan


    const handleSubmit = async (e:React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading) return; // Prevent multiple submissions
        setIsLoading(true); // Start loading
        setError(null)
        setSuccessMessage(null); // Reset success message on new submission

        try{
            //Send data to your Flask backend
            const response = await fetch(`${API_BASE}/signup`, {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                }, 
                body: JSON.stringify({ name, email, password, plan })
            });

            const data = await response.json();

            if(response.ok){
              setSuccessMessage("Account created successfully!"); // Set success message
              setName("");
              setEmail("");
              setPassword("");

              // Sign in with Firebase using custom token generated from the backend
              const { custom_token } = data;
              await signInWithCustomToken(auth, custom_token);

              setTimeout(() => { navigate("/home", { replace: true }); }, 3000); // Redirect to home page with 3 sec delay
              // Navigation is handled by useEffect
            } else {
                setError(data.error || "Failed to sign up. Please try again.");
                setIsLoading(false); // Stop loading
            }

        } catch (error) {
            setError("Sign up failed. Please try again.");
            console.error("Sign up error:", error);
            setIsLoading(false); // Stop loading
        }
    };


        // Handle auth state for other scenarios
        useEffect(() => {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("Auth state changed:", user ? user.uid : "No user");
            if (user && !successMessage) {
    
              navigate("/home", { replace: true }); // Redirect to home page if user is authenticated
          }
      });
      return () => unsubscribe(); // Cleanup subscription on unmount
      }, [navigate, successMessage]);


return (
    <div className="signup-page">
      <h2>Sign Up</h2>
      {error && <p className="error">{error}</p>}
      {successMessage && <p className="success">{successMessage}</p>} {/* Display success message */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Add your name: </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter a name..." required disabled={isLoading}/>
        </div>
        <div className="form-group">
          <label>Add your email: </label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter an email..."  required disabled={isLoading}/>
        </div>
        <div className="form-group">
          <label>Create a password: </label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a password..."  required disabled={isLoading}/>
        </div>
        <button type="submit">
          {isLoading ? "Signing Up..." : "Sign Up"}</button>
      </form>
    </div>
  );
};

export default SignUpPage;
