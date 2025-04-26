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

interface UserData {
  name: string;
  email: string;
  plan: string;
}

interface UsageData {
  visits: number;
  sentiments: number;
  recent: string[];
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'usage'>('profile');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [usageData, setUsageData] = useState<UsageData>({
    visits: 0,
    sentiments: 0,
    recent: []
  });
  const [showCount, setShowCount] = useState(10);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [showChangePw, setShowChangePw] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const fetchUserAndUsage = async () => {
      const u = auth.currentUser;
      if (u) {
        // fetch profile
        try {
          const userRef = doc(db, 'users', u.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const d = userSnap.data() as any;
            setUserData({
              name: d.name,
              email: u.email || d.email,
              plan: d.plan
            });
          } else {
            setUserData({ name: '', email: u.email || '', plan: 'free' });
          }
        } catch (err) {
          console.warn('Could not read user profile', err);
          setUserData({ name: '', email: u.email || '', plan: 'free' });
        }

        // fetch usage
        try {
          const usageRef = doc(db, 'users', u.uid);
          const usageSnap = await getDoc(usageRef);
          if (usageSnap.exists()) {
            const d = usageSnap.data() as any;
            setUsageData({
              visits: d.visits || 0,
              sentiments: d.sentiments || 0,
              recent: Array.isArray(d.recent) ? d.recent : []
            });
          }
        } catch (err) {
          console.warn('Could not read usage data', err);
        }
      }
      setLoading(false);
    };

    fetchUserAndUsage();
  }, []);

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
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
          Profile
        </button>
        <button className={activeTab === 'subscription' ? 'active' : ''} onClick={() => setActiveTab('subscription')}>
          Subscription
        </button>
        <button className={activeTab === 'usage' ? 'active' : ''} onClick={() => setActiveTab('usage')}>
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
              <span>{userData.plan.toUpperCase()}</span>
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
              <span>{userData?.plan.toUpperCase()}</span>
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
              <div
                style={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  border: '1px solid #ccc',
                  padding: '0.5rem',
                  borderRadius: 4
                }}
              >
                {usageData.recent.slice(0, showCount).map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '0.25rem' }}>
                    {idx + 1}. {item}
                  </div>
                ))}
                {usageData.recent.length > showCount && (
                  <button
                    onClick={() => setShowCount(count => count + 10)}
                    style={{ marginTop: '0.5rem' }}
                  >
                    Load More
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
