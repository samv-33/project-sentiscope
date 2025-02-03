// src/App.tsx
//import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import SettingsPage from './pages/SettingsPage';
import './assets/App.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <div className="content">
         <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/settings" element={<SettingsPage />} />
         </Routes>
      </div>
    </div>
  );
}

export default App;
