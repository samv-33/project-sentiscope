// src/pages/SignUpPage.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignUpPage = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [plan, setPlan] = useState("free");
    const [error, setError] = useState<string | null>(null); 
    const navigate  = useNavigate();

    const handleSubmit = async (e:React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null)

        try{
            //Send data to your Flask backend
            const response = await fetch('http://127.0.0.1:5000/signup', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                }, 
                body: JSON.stringify({ name, email, password, plan})
            });

            const data = await response.json();

            if(response.ok){
                navigate("/home");
            } else {
                setError(data.error || "Failed to sign up. Please try again.");
            }

        } catch (error) {
            setError("Sign up failed. Please try again.");
            console.error("Sign up error:", error);

        }
    }

return (
    <div className="signup-page">
      <h2>Sign Up</h2>
      {error && <p>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Add your name: </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter a name..." required/>
        </div>
        <div className="form-group">
          <label>Add your email: </label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter an email..."  required/>
        </div>
        <div className="form-group">
          <label>Create a password: </label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a password..."  required/>
        </div>
        {/*<div className="form-group">
        /*  <label>Subscription Plan: </label>
        /*  <select value={plan} onChange={(e) => setPlan(e.target.value)}>
        /*    <option value="free">Free</option>
        /*    <option value="premium">Premium</option>
        /*  </select>
        /*</div>*/}
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default SignUpPage;
