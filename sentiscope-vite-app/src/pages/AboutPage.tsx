// src/pages/AboutPage.tsx
//import React from 'react';

const AboutPage = () => {
  return (
    <div className="about-page">
      <p>
        Sentiscope is a sentiment analysis tool that helps you guage the public sentiment on any keyword.
      </p>
      <h2>Future Updates Log for Sentiscope v2.0:</h2>
      <p>For Developer Notes:</p>
      <ul>
        <li>Build a larger ML model to handle more data and improve accuracy.</li>
        <li>Implement pagination to fetch more posts for precision and accurate sentiment on niche keywords.</li>
        <li>Implemention of tracking keywords by cached results instead of Firestore data.</li>
        <li>Implement more charts and graphs for visualization</li>
        <li>Offer more sign up options (e.g. Google Sign-in, Meta...)</li>
        <li>Offer different subscription plans tailored for different types of users.</li>
        <li>Fix minor bugs, improve overall security.</li>
      </ul>
    </div>
  );
};

export default AboutPage;
