import React from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  Phone, 
  PhoneOff,
  Settings
} from 'lucide-react';

const MeetingControls = ({
  isVideoEnabled,
  isAudioEnabled,
  isScreenSharing,
  onToggleVideo,
  onToggleAudio,
  onToggleScreenShare,
  onLeaveMeeting
}) => {
  return (
    <div className="meeting-controls">
      <div className="flex items-center space-x-2">
        {/* Audio Toggle */}
        <button
          onClick={onToggleAudio}
          className={`p-3 rounded-full transition-colors duration-200 ${
            isAudioEnabled
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
          title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isAudioEnabled ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
        </button>

        {/* Video Toggle */}
        <button
          onClick={onToggleVideo}
          className={`p-3 rounded-full transition-colors duration-200 ${
            isVideoEnabled
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
          title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoEnabled ? (
            <Video className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </button>

        {/* Screen Share Toggle */}
        <button
          onClick={onToggleScreenShare}
          className={`p-3 rounded-full transition-colors duration-200 ${
            isScreenSharing
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
        >
          <Monitor className="h-5 w-5" />
        </button>

        {/* Settings */}
        <button
          className="p-3 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors duration-200"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* Leave Meeting */}
        <button
          onClick={onLeaveMeeting}
          className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
          title="Leave meeting"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default MeetingControls;
