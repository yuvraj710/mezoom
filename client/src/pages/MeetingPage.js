import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { meetingService } from '../services/meetingService';
import MeetingControls from '../components/MeetingControls';
import VideoGrid from '../components/VideoGrid';
import ChatSidebar from '../components/ChatSidebar';
import MeetingHeader from '../components/MeetingHeader';
import { Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const MeetingPage = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { socket, joinRoom, sendOffer, sendAnswer, sendIceCandidate, changeMediaState } = useSocket();
  const { user } = useAuth();
  
  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const localUsername = user?.username || 'Guest';

  // Initialize meeting
  useEffect(() => {
    const initializeMeeting = async () => {
      try {
        setIsLoading(true);
        
        // Get meeting details
        const meetingData = await meetingService.getMeeting(meetingId);
        setMeeting(meetingData.meeting);
        
        // Join the meeting
        await meetingService.joinMeeting(meetingId);
        
        // Request camera and microphone permissions
        await requestMediaPermissions();
        
        // Join socket room
        joinRoom(meetingId, localUsername);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Meeting initialization error:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    initializeMeeting();
  }, [meetingId, joinRoom, localUsername]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = (data) => {
      console.log('User joined:', data);
      setParticipants(prev => [...prev, {
        socketId: data.socketId,
        username: data.username,
        userId: data.userId,
        isVideoEnabled: false,
        isAudioEnabled: false,
        stream: null
      }]);
    };

    const handleUserLeft = (data) => {
      console.log('User left:', data);
      setParticipants(prev => prev.filter(p => p.socketId !== data.socketId));
      
      // Close peer connection
      if (peerConnectionsRef.current[data.socketId]) {
        peerConnectionsRef.current[data.socketId].close();
        delete peerConnectionsRef.current[data.socketId];
      }
    };

    const handleRoomJoined = (data) => {
      console.log('Room joined:', data);
      setParticipants(data.participants.map(p => ({
        ...p,
        stream: null
      })));
    };

    const handleOffer = async (data) => {
      console.log('Received offer from:', data.sender);
      try {
        const peerConnection = createPeerConnection(data.sender);
        await peerConnection.setRemoteDescription(data.offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        sendAnswer(data.sender, answer);
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    };

    const handleAnswer = async (data) => {
      console.log('Received answer from:', data.sender);
      try {
        const peerConnection = peerConnectionsRef.current[data.sender];
        if (peerConnection) {
          await peerConnection.setRemoteDescription(data.answer);
        }
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    };

    const handleIceCandidate = async (data) => {
      console.log('Received ICE candidate from:', data.sender);
      try {
        const peerConnection = peerConnectionsRef.current[data.sender];
        if (peerConnection) {
          await peerConnection.addIceCandidate(data.candidate);
        }
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    };

    const handleUserMediaStateChanged = (data) => {
      setParticipants(prev => prev.map(p => 
        p.socketId === data.socketId 
          ? { ...p, isVideoEnabled: data.isVideoEnabled, isAudioEnabled: data.isAudioEnabled }
          : p
      ));
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('room-joined', handleRoomJoined);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('user-media-state-changed', handleUserMediaStateChanged);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('room-joined', handleRoomJoined);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('user-media-state-changed', handleUserMediaStateChanged);
    };
  }, [socket, sendAnswer, sendIceCandidate]);

  // Request media permissions
  const requestMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
      
      // Notify other participants about media state
      changeMediaState(meetingId, true, true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast.error('Unable to access camera and microphone');
    }
  };

  // Create peer connection
  const createPeerConnection = (socketId) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream from:', socketId);
      const remoteStream = event.streams[0];
      
      setParticipants(prev => prev.map(p => 
        p.socketId === socketId 
          ? { ...p, stream: remoteStream }
          : p
      ));
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendIceCandidate(socketId, event.candidate);
      }
    };

    peerConnectionsRef.current[socketId] = peerConnection;
    return peerConnection;
  };

  // Start call with all participants
  const startCall = useCallback(async () => {
    for (const participant of participants) {
      if (participant.socketId !== socket.id) {
        try {
          const peerConnection = createPeerConnection(participant.socketId);
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          sendOffer(participant.socketId, offer);
        } catch (error) {
          console.error('Error starting call with participant:', error);
        }
      }
    }
  }, [participants, socket, sendOffer]);

  // Start call when participants are available
  useEffect(() => {
    if (participants.length > 0 && localStreamRef.current) {
      startCall();
    }
  }, [participants.length, startCall]);

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const newVideoState = videoTrack.enabled;
        setIsVideoEnabled(newVideoState);
        changeMediaState(meetingId, newVideoState, isAudioEnabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newAudioState = audioTrack.enabled;
        setIsAudioEnabled(newAudioState);
        changeMediaState(meetingId, isVideoEnabled, newAudioState);
      }
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        // Replace video track
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionsRef.current[Object.keys(peerConnectionsRef.current)[0]]?.getSenders()
          .find(s => s.track && s.track.kind === 'video');
        
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        setIsScreenSharing(true);
        
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
      } else {
        // Stop screen sharing and return to camera
        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          const sender = peerConnectionsRef.current[Object.keys(peerConnectionsRef.current)[0]]?.getSenders()
            .find(s => s.track && s.track.kind === 'video');
          
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        }
        
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      toast.error('Unable to share screen');
    }
  };

  // Leave meeting
  const leaveMeeting = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close all peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};
    
    navigate('/');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Joining meeting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-white text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <MeetingHeader 
        meeting={meeting}
        participantCount={participants.length + 1}
        onToggleChat={() => setShowChat(!showChat)}
        showChat={showChat}
      />
      
      <div className="flex-1 flex">
        <div className={`flex-1 ${showChat ? 'mr-80' : ''} transition-all duration-300`}>
          <VideoGrid
            participants={participants}
            localVideoRef={localVideoRef}
            localUsername={localUsername}
            isVideoEnabled={isVideoEnabled}
            isAudioEnabled={isAudioEnabled}
          />
        </div>
        
        {showChat && (
          <ChatSidebar
            meetingId={meetingId}
            onClose={() => setShowChat(false)}
          />
        )}
      </div>
      
      <MeetingControls
        isVideoEnabled={isVideoEnabled}
        isAudioEnabled={isAudioEnabled}
        isScreenSharing={isScreenSharing}
        onToggleVideo={toggleVideo}
        onToggleAudio={toggleAudio}
        onToggleScreenShare={toggleScreenShare}
        onLeaveMeeting={leaveMeeting}
      />
    </div>
  );
};

export default MeetingPage;
