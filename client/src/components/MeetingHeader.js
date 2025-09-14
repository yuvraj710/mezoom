import React from 'react';
import { Video, Users, MessageCircle, X } from 'lucide-react';

const MeetingHeader = ({ meeting, participantCount, onToggleChat, showChat }) => {
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Video className="h-6 w-6 text-white" />
            <h1 className="text-lg font-semibold text-white">
              {meeting?.title || 'Meeting'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-300">
            <Users className="h-4 w-4" />
            <span className="text-sm">{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleChat}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              showChat 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={showChat ? 'Close chat' : 'Open chat'}
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingHeader;
