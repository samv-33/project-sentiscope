// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'usage'>('profile');
  const [userData, setUserData] = useState<{ name: string; email: string; plan: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [showChangePw, setShowChangePw] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Placeholder usage data
  const [usageData] = useState<{ visits: number; sentiments: number; recent: string[] }>({
    visits: 0,
    sentiments: 0,
    recent: []
  });

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUser = async () => {
      const u = auth.currentUser;
      if (u) {
        try {
          const docRef = doc(db, 'users', u.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data() as any;
            setUserData({
              name: data.name,
              email: u.email || data.email,
              plan: data.plan
            });
          } else {
            setUserData({ name: '', email: u.email || '', plan: 'free' });
          }
        } catch (err) {
          console.warn('Could not read user profile (permissions?), using auth defaults.', err);
          setUserData({
            name: auth.currentUser?.displayName || '',
            email: auth.currentUser?.email || '',
            plan: 'free'
          });
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  // Handle password update
  const handleChangePassword = async () => {
    setPasswordError('');
    if (!auth.currentUser) return;
    if (!oldPassword || !newPassword) {
      setPasswordError('Both fields are required.');
      return;
    }
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email || '',
        oldPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      alert('Password changed successfully!');
      setShowChangePw(false);
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordError(err.message);
    }
  };

  // Log out
  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="settings-page">
      <h2>Settings</h2>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={activeTab === 'subscription' ? 'active' : ''}
          onClick={() => setActiveTab('subscription')}
        >
          Subscription
        </button>
        <button
          className={activeTab === 'usage' ? 'active' : ''}
          onClick={() => setActiveTab('usage')}
        >
          Usage
        </button>
      </div>

      <div className="settings-content">
        {/* Profile Tab */}
        {activeTab === 'profile' && userData && (
          <div className="settings-form">
            <div className="form-group">
              <label>Name:</label>
              <span>{userData.name}</span>
            </div>
            <div className="form-group">
              <label>Email:</label>
              <span>{userData.email}</span>
            </div>
            <div className="form-group">
              <label>Plan:</label>
              <span>{(userData.plan || 'free').toUpperCase()}</span>
            </div>

            <button onClick={() => setShowChangePw(prev => !prev)}>
              {showChangePw ? 'Cancel' : 'Change Password'}
            </button>

            {showChangePw && (
              <div className="settings-form" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Old Password:</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>New Password:</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
                {passwordError && <div className="error-text">{passwordError}</div>}
                <button onClick={handleChangePassword}>Save</button>
              </div>
            )}

            <button style={{ marginTop: '2rem' }} onClick={handleLogout}>
              Log Out
            </button>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="settings-form">
            <div className="form-group">
              <label>Current Plan:</label>
              <span>{userData?.plan || 'free'}</span>
            </div>
            <p style={{ marginTop: '1rem' }}>Subscriptions coming soon.</p>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="settings-form">
            <div className="form-group">
              <label>Site Visits:</label>
              <span>{usageData.visits}</span>
            </div>
            <div className="form-group">
              <label>Sentiments Created:</label>
              <span>{usageData.sentiments}</span>
            </div>
            <div className="form-group">
              <label>Recent Searches:</label>
              {usageData.recent.length > 0 ? (
                <ul>
                  {usageData.recent.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <span>No usage data available.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
