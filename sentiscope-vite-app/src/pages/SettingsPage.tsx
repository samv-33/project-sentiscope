// src/pages/SettingsPage.tsx
import React from 'react';
import axios from "axios";

const SettingsPage: React.FC = () => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    //Extract form data
    const form = e.currentTarget;
    const formData = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      plan: (form.elements.namedItem("plan") as HTMLInputElement).value,
  };

    try {
      const response = await axios.post('http://localhost:5000/signup', formData);
      if (response.data.message === "User signed up successfully!"){
        alert('Account created successfully!');

      } else {
        console.error(response.data.error);
      }
    } catch (error){
      console.error(error);
    }
     };



//const SettingsPage = () => {
  return (
    <div className="settings-page">
      <h2>Account Settings</h2>
      <form className="settings-form" onSubmit={ handleSubmit }>
        <div className="form-group">
          <label>Name:</label>
          <input type="text" placeholder="Your Name" />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input type="email" placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input type="password" placeholder="********" />
        </div>
        <div className="form-group">
          <label>Subscription Plan:</label>
          <select>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

export default SettingsPage;
