// src/pages/SettingsPage.tsx
//import React from 'react';

const SettingsPage = () => {
  return (
    <div className="settings-page">
      <h2>Account Settings</h2>
      <form className="settings-form">
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
