import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Video, Users, Plus, LogIn, UserPlus, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [meetingId, setMeetingId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateMeeting = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/meetings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isAuthenticated && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
        },
        body: JSON.stringify({
          title: 'New Meeting',
          description: 'Created via MeZoom',
          isPrivate: false
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        navigate(`/meeting/${data.meeting.id}`);
      } else {
        toast.error(data.error || 'Failed to create meeting');
      }
    } catch (error) {
      console.error('Create meeting error:', error);
      toast.error('Failed to create meeting');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMeeting = () => {
    if (!meetingId.trim()) {
      toast.error('Please enter a meeting ID');
      return;
    }
    navigate(`/meeting/${meetingId.trim()}`);
  };

  const handleJoinWithLink = () => {
    navigate('/join');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">MeZoom</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Welcome, {user?.username}
                  </span>
                  <button
                    onClick={() => {
                      localStorage.removeItem('token');
                      window.location.reload();
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Login</span>
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="btn-primary flex items-center space-x-1"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Sign Up</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Video conferencing
            <span className="text-primary-600"> made simple</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Connect with anyone, anywhere. High-quality video calls, screen sharing, 
            and real-time collaboration in one seamless experience.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {/* Create Meeting */}
          <div className="card hover:shadow-lg transition-shadow duration-300">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Create Meeting
              </h3>
              <p className="text-gray-600 mb-6">
                Start a new meeting and invite others with a simple link
              </p>
              <button
                onClick={handleCreateMeeting}
                disabled={isCreating}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {isCreating ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Start Meeting</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Join Meeting */}
          <div className="card hover:shadow-lg transition-shadow duration-300">
            <div className="text-center">
              <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Join Meeting
              </h3>
              <p className="text-gray-600 mb-6">
                Enter a meeting ID or use a meeting link to join
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter Meeting ID"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  className="input-field"
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinMeeting()}
                />
                <button
                  onClick={handleJoinMeeting}
                  className="btn-secondary w-full"
                >
                  Join Meeting
                </button>
              </div>
            </div>
          </div>

          {/* Join with Link */}
          <div className="card hover:shadow-lg transition-shadow duration-300 md:col-span-2 lg:col-span-1">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Join with Link
              </h3>
              <p className="text-gray-600 mb-6">
                Paste a meeting link to join instantly
              </p>
              <button
                onClick={handleJoinWithLink}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <Video className="h-4 w-4" />
                <span>Join with Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 p-8 md:p-12">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything you need for productive meetings
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Video className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">HD Video</h4>
              <p className="text-sm text-gray-600">Crystal clear video quality</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Screen Share</h4>
              <p className="text-sm text-gray-600">Share your screen with everyone</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Copy className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Easy Sharing</h4>
              <p className="text-sm text-gray-600">Simple links to join meetings</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Check className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">No Downloads</h4>
              <p className="text-sm text-gray-600">Works in your browser</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-secondary-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 MeZoom. Built with ❤️ for seamless video conferencing.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
