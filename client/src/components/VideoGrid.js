import React from 'react';
import { Mic, MicOff, Video, VideoOff, User } from 'lucide-react';

const VideoGrid = ({ 
  participants, 
  localVideoRef, 
  localUsername, 
  isVideoEnabled, 
  isAudioEnabled 
}) => {
  const allParticipants = [
    {
      socketId: 'local',
      username: localUsername,
      isVideoEnabled,
      isAudioEnabled,
      stream: null,
      isLocal: true
    },
    ...participants
  ];

  return (
    <div className="p-4 h-full">
      <div className="video-grid h-full">
        {allParticipants.map((participant) => (
          <VideoTile
            key={participant.socketId}
            participant={participant}
            localVideoRef={participant.isLocal ? localVideoRef : null}
          />
        ))}
      </div>
    </div>
  );
};

const VideoTile = ({ participant, localVideoRef }) => {
  const { username, isVideoEnabled, isAudioEnabled, stream, isLocal } = participant;

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
      {isVideoEnabled ? (
        <video
          ref={localVideoRef}
          autoPlay
          muted={isLocal}
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
          <div className="text-center">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-2" />
            <p className="text-white font-medium">{username}</p>
          </div>
        </div>
      )}
      
      {/* Audio indicator */}
      <div className="absolute top-2 left-2">
        {isAudioEnabled ? (
          <Mic className="h-4 w-4 text-green-500" />
        ) : (
          <MicOff className="h-4 w-4 text-red-500" />
        )}
      </div>
      
      {/* Video indicator */}
      <div className="absolute top-2 right-2">
        {isVideoEnabled ? (
          <Video className="h-4 w-4 text-green-500" />
        ) : (
          <VideoOff className="h-4 w-4 text-red-500" />
        )}
      </div>
      
      {/* Username overlay */}
      <div className="absolute bottom-2 left-2 right-2">
        <div className="bg-black bg-opacity-50 rounded px-2 py-1">
          <p className="text-white text-sm font-medium truncate">
            {username} {isLocal && '(You)'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoGrid;
