import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, ArrowLeft, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const JoinMeetingPage = () => {
  const navigate = useNavigate();
  const [meetingLink, setMeetingLink] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const extractMeetingId = (link) => {
    // Extract meeting ID from various link formats
    const patterns = [
      /\/meeting\/([a-zA-Z0-9]+)/,
      /meeting\/([a-zA-Z0-9]+)/,
      /([a-zA-Z0-9]{8,})/,
    ];

    for (const pattern of patterns) {
      const match = link.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  const handleJoinMeeting = async () => {
    if (!meetingLink.trim()) {
      toast.error('Please enter a meeting link or ID');
      return;
    }

    setIsJoining(true);
    try {
      const meetingId = extractMeetingId(meetingLink);
      
      if (!meetingId) {
        toast.error('Invalid meeting link format');
        return;
      }

      // Verify meeting exists
      const response = await fetch(`/api/meetings/${meetingId}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        navigate(`/meeting/${meetingId}`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Meeting not found');
      }
    } catch (error) {
      console.error('Join meeting error:', error);
      toast.error('Failed to join meeting');
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoinMeeting();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
          
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Video className="h-8 w-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Join Meeting</h1>
          </div>
          
          <p className="text-gray-600">
            Enter the meeting link or ID to join
          </p>
        </div>

        {/* Join Form */}
        <div className="card">
          <div className="space-y-6">
            <div>
              <label htmlFor="meetingLink" className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Link or ID
              </label>
              <input
                id="meetingLink"
                type="text"
                placeholder="https://mezoom.com/meeting/abc123 or abc123"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                onKeyPress={handleKeyPress}
                className="input-field"
                autoFocus
              />
            </div>

            <button
              onClick={handleJoinMeeting}
              disabled={isJoining || !meetingLink.trim()}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {isJoining ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  <span>Join Meeting</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            You can join with either a full meeting link or just the meeting ID
          </p>
        </div>

        {/* Example Links */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Example formats:</h3>
          <div className="space-y-1 text-xs text-gray-600">
            <p>• <code className="bg-white px-1 rounded">abc123def456</code></p>
            <p>• <code className="bg-white px-1 rounded">https://mezoom.com/meeting/abc123</code></p>
            <p>• <code className="bg-white px-1 rounded">meeting/abc123def456</code></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinMeetingPage;
