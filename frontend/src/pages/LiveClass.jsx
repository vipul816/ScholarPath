import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { classAPI } from '../services/api';
import Whiteboard from '../components/Whiteboard';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Users, Clock, Camera, AlertCircle, RefreshCw, Save, FileText } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:3000`;

const LiveClass = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isInstructor } = useAuth();
    const [loading, setLoading] = useState(true);
    const [classDetails, setClassDetails] = useState(null);

    // Class state
    const [isClassLive, setIsClassLive] = useState(false);
    const [waitingForInstructor, setWaitingForInstructor] = useState(false);

    // Media states
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [showChat, setShowChat] = useState(true);
    const [showParticipants, setShowParticipants] = useState(false);

    // Participants
    const [participants, setParticipants] = useState([]);

    // Notes
    const [classNotes, setClassNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    const [showNotes, setShowNotes] = useState(false);

    // Refs
    const localVideoRef = useRef(null);
    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const chatInitializedRef = useRef(false);

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initialize camera - separate useEffect for reliability
    const startCamera = useCallback(async () => {
        setCameraError(null);
        setCameraReady(false);

        try {
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera access not supported in this browser');
            }

            // Stop any existing stream
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }

            console.log('Requesting camera access...');

            // Request camera with constraints
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: true
            });

            console.log('Camera access granted, tracks:', stream.getTracks().map(t => t.kind));

            localStreamRef.current = stream;

            // Wait for video element to be ready
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;

                // Important: Wait for loadedmetadata event
                await new Promise((resolve, reject) => {
                    const video = localVideoRef.current;
                    if (!video) {
                        reject(new Error('Video element not found'));
                        return;
                    }

                    video.onloadedmetadata = () => {
                        console.log('Video metadata loaded');
                        video.play()
                            .then(() => {
                                console.log('Video playing');
                                resolve();
                            })
                            .catch(err => {
                                console.error('Video play error:', err);
                                // Try muted play (required by some browsers)
                                video.muted = true;
                                video.play().then(resolve).catch(reject);
                            });
                    };

                    video.onerror = (e) => {
                        reject(new Error('Video element error'));
                    };

                    // Timeout fallback
                    setTimeout(() => {
                        if (video.readyState >= 2) {
                            resolve();
                        }
                    }, 2000);
                });

                setCameraReady(true);
                setVideoEnabled(true);
                setAudioEnabled(true);
                console.log('Camera initialized successfully');
                return true;
            }
        } catch (error) {
            console.error('Camera error:', error);

            let errorMessage = 'Could not access camera';
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = 'No camera found. Please connect a camera and try again.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = 'Camera is in use by another application. Please close other apps using the camera.';
            } else if (error.name === 'OverconstrainedError') {
                errorMessage = 'Camera does not support the requested settings.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            setCameraError(errorMessage);
            setVideoEnabled(false);

            // Try audio only as fallback
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStreamRef.current = audioStream;
                setAudioEnabled(true);
                console.log('Audio-only mode enabled');
            } catch (audioErr) {
                console.error('Audio also failed:', audioErr);
                setAudioEnabled(false);
            }

            return false;
        }
    }, []);

    // Initialize socket and class
    useEffect(() => {
        const initializeClass = async () => {
            try {
                const response = await classAPI.getById(id);
                if (!response.success) {
                    setLoading(false);
                    return;
                }

                setClassDetails(response.class);
                const isUserInstructor = response.class.course?.instructorId === user.id;

                // Initialize camera first
                await startCamera();

                // Initialize Socket.io
                const token = localStorage.getItem('token');
                socketRef.current = io(SOCKET_URL, {
                    transports: ['websocket', 'polling'],
                    auth: { token }
                });

                // Setup socket listeners ONCE
                if (!chatInitializedRef.current) {
                    chatInitializedRef.current = true;

                    socketRef.current.on('chat-message', (msg) => {
                        setMessages(prev => {
                            const isDuplicate = prev.some(
                                m => m.timestamp === msg.timestamp && m.userId === msg.userId && m.message === msg.message
                            );
                            if (isDuplicate) return prev;
                            return [...prev, msg];
                        });
                    });

                    socketRef.current.on('participants-update', ({ participants: newParticipants }) => {
                        if (newParticipants) setParticipants(newParticipants);
                    });

                    socketRef.current.on('class-started', () => {
                        setIsClassLive(true);
                        setWaitingForInstructor(false);
                    });

                    socketRef.current.on('class-ended', () => {
                        setIsClassLive(false);
                        alert('The instructor has ended the class.');
                        navigate(isUserInstructor ? '/instructor' : '/dashboard');
                    });

                    socketRef.current.on('auth-error', ({ message }) => {
                        alert(message || 'Your session has expired. Please login again.');
                        navigate('/login');
                    });

                    socketRef.current.on('class-access-denied', ({ message }) => {
                        alert(message || 'You are not allowed to join this class.');
                        navigate(isUserInstructor ? '/instructor' : '/dashboard');
                    });

                    socketRef.current.on('user-joined', ({ userName }) => {
                        setMessages(prev => [...prev, {
                            type: 'system',
                            message: `${userName} joined the class`,
                            timestamp: new Date().toISOString()
                        }]);
                    });

                    socketRef.current.on('user-left', ({ userName }) => {
                        setMessages(prev => [...prev, {
                            type: 'system',
                            message: `${userName} left the class`,
                            timestamp: new Date().toISOString()
                        }]);
                    });
                }

                // Join the room
                const roomId = `class-${id}`;
                socketRef.current.emit('join-class', {
                    roomId,
                    classId: Number(id)
                });

                if (isUserInstructor) {
                    setIsClassLive(true);
                    socketRef.current.emit('start-class', { roomId, classId: Number(id) });
                } else {
                    socketRef.current.emit('check-class-status', { roomId, classId: Number(id) });
                    socketRef.current.on('class-status', ({ isLive }) => {
                        if (isLive) {
                            setIsClassLive(true);
                        } else {
                            setWaitingForInstructor(true);
                        }
                    });
                }

                if (!isUserInstructor) {
                    try {
                        await classAPI.markAttendance(id);
                    } catch (e) {
                        console.log('Attendance marking failed:', e);
                    }
                }

            } catch (error) {
                console.error('Error initializing class:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeClass();

        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (socketRef.current) {
                socketRef.current.emit('leave-class', {
                    roomId: `class-${id}`
                });
                socketRef.current.disconnect();
            }
            chatInitializedRef.current = false;
        };
    }, [id, user, navigate, startCamera]);

    const toggleAudio = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioEnabled;
                setAudioEnabled(!audioEnabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoEnabled;
                setVideoEnabled(!videoEnabled);
            }
        }
    };

    const handleLeave = () => {
        if (window.confirm('Are you sure you want to leave the class?')) {
            const isUserInstructor = classDetails?.course?.instructorId === user.id;
            if (isUserInstructor) {
                // Save notes before ending
                if (classNotes.trim()) {
                    saveNotesBeforeLeave();
                }
                socketRef.current?.emit('end-class', { roomId: `class-${id}`, classId: id });
            }
            navigate(isInstructor ? '/instructor' : '/dashboard');
        }
    };

    const saveNotes = async () => {
        if (!classNotes.trim()) {
            alert('Please add some notes before saving');
            return;
        }

        setSavingNotes(true);
        try {
            const response = await classAPI.saveNotes(id, {
                noteContent: classNotes,
                summary: classNotes.substring(0, 200) // Store first 200 chars as summary
            });

            if (response.success) {
                alert('Notes saved successfully!');
            } else {
                alert(response.message || 'Failed to save notes');
            }
        } catch (error) {
            console.error('Error saving notes:', error);
            alert('Error saving notes: ' + (error.message || 'Unknown error'));
        } finally {
            setSavingNotes(false);
        }
    };

    const saveNotesBeforeLeave = async () => {
        try {
            await classAPI.saveNotes(id, {
                noteContent: classNotes,
                summary: classNotes.substring(0, 200)
            });
        } catch (error) {
            console.error('Error auto-saving notes:', error);
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socketRef.current) return;

        socketRef.current.emit('chat-message', {
            roomId: `class-${id}`,
            message: newMessage.trim()
        });
        setNewMessage('');
    };

    const retryCamera = async () => {
        setCameraError(null);
        await startCamera();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p>Setting up your camera and joining class...</p>
                </div>
            </div>
        );
    }

    if (!classDetails) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
                <div className="text-center">
                    <p className="text-red-400 mb-4">Class not found</p>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (waitingForInstructor && !isClassLive) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
                <div className="text-center max-w-md">
                    <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold mb-2">Waiting for Instructor</h2>
                    <p className="text-gray-400 mb-6">
                        The class "{classDetails.title}" hasn't started yet. Please wait for the instructor to begin.
                    </p>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-outline">
                        Leave Waiting Room
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-gray-800 px-4 py-3 flex justify-between items-center shadow-md z-10">
                <div className="flex items-center space-x-4">
                    <h1 className="text-white font-bold text-lg">{classDetails?.title}</h1>
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded animate-pulse flex items-center gap-1">
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                        LIVE
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    {classDetails?.course?.instructorId === user.id && (
                        <button
                            onClick={() => { setShowNotes(!showNotes); if (!showNotes) setShowChat(false); setShowParticipants(false); }}
                            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${showNotes ? 'bg-gray-700 text-primary-400' : 'text-gray-400 hover:text-white'}`}
                            title="Notes"
                        >
                            <FileText className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        onClick={() => { setShowParticipants(!showParticipants); if (!showParticipants) setShowChat(false); }}
                        className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${showParticipants ? 'bg-gray-700 text-primary-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Users className="w-5 h-5" />
                        <span className="text-sm">{participants.length}</span>
                    </button>
                    <button
                        onClick={() => { setShowChat(!showChat); if (!showChat) setShowParticipants(false); }}
                        className={`p-2 rounded-lg transition-colors ${showChat ? 'bg-gray-700 text-primary-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        <MessageSquare className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-grow flex overflow-hidden">
                {/* Left: Whiteboard & Videos */}
                <div className="flex-grow flex flex-col p-4 space-y-4">
                    {/* Whiteboard Area */}
                    <div className="flex-grow bg-white rounded-xl overflow-hidden shadow-lg">
                        <Whiteboard
                            socket={socketRef.current}
                            roomId={`class-${id}`}
                            isReadOnly={classDetails?.course?.instructorId !== user.id}
                        />
                    </div>

                    {/* Video Strip */}
                    <div className="h-36 flex space-x-4 overflow-x-auto pb-2">
                        {/* Local Video */}
                        <div className="relative w-52 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 border-2 border-primary-500">
                            {/* Video Element - always render but hide when no video */}
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover ${(!videoEnabled || !cameraReady) ? 'hidden' : ''}`}
                            />

                            {/* Placeholder when video is off */}
                            {(!videoEnabled || !cameraReady) && !cameraError && (
                                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                    <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                        {user.name?.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                            )}

                            {/* Camera Error State */}
                            {cameraError && (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700 p-2 text-center">
                                    <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
                                    <p className="text-xs text-gray-300 mb-2">{cameraError}</p>
                                    <button
                                        onClick={retryCamera}
                                        className="flex items-center gap-1 text-xs bg-primary-600 hover:bg-primary-700 text-white px-2 py-1 rounded"
                                    >
                                        <RefreshCw className="w-3 h-3" /> Retry
                                    </button>
                                </div>
                            )}

                            {/* Labels */}
                            <div className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-2 py-1 rounded flex items-center gap-1">
                                {classDetails?.course?.instructorId === user.id && (
                                    <span className="bg-yellow-500 text-black text-xs px-1 rounded font-medium">Host</span>
                                )}
                                You
                            </div>

                            {/* Status indicators */}
                            <div className="absolute top-2 right-2 flex gap-1">
                                {!audioEnabled && <MicOff className="w-4 h-4 text-red-500 bg-black/50 rounded p-0.5" />}
                                {!videoEnabled && <VideoOff className="w-4 h-4 text-red-500 bg-black/50 rounded p-0.5" />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Chat/Participants/Notes Sidebar */}
                {(showChat || showParticipants || showNotes) && (
                    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                        {/* Notes Panel */}
                        {showNotes && (
                            <div className="flex-grow flex flex-col">
                                <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                                    <h3 className="text-white font-semibold">Class Notes</h3>
                                    <button
                                        onClick={saveNotes}
                                        disabled={savingNotes || !classNotes.trim()}
                                        className="p-1 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Save notes"
                                    >
                                        <Save className="w-4 h-4" />
                                    </button>
                                </div>
                                <textarea
                                    value={classNotes}
                                    onChange={(e) => setClassNotes(e.target.value)}
                                    placeholder="Take notes during the class..."
                                    className="flex-grow p-3 bg-gray-700 text-white border-none resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        )}
                        {showChat && (
                            <div className="flex-grow flex flex-col">
                                <div className="p-3 border-b border-gray-700">
                                    <h3 className="text-white font-semibold">Class Chat</h3>
                                </div>
                                <div className="flex-grow overflow-y-auto p-3 space-y-3">
                                    {messages.length === 0 && (
                                        <p className="text-center text-gray-500 text-sm py-4">No messages yet</p>
                                    )}
                                    {messages.map((msg, idx) => (
                                        msg.type === 'system' ? (
                                            <div key={idx} className="text-center text-xs text-gray-500 py-1">
                                                {msg.message}
                                            </div>
                                        ) : (
                                            <div key={idx} className={`flex flex-col ${msg.userId === user.id ? 'items-end' : 'items-start'}`}>
                                                <div className={`max-w-[85%] rounded-lg px-3 py-2 ${msg.userId === user.id
                                                        ? 'bg-primary-600 text-white'
                                                        : msg.isInstructor
                                                            ? 'bg-yellow-600 text-white'
                                                            : 'bg-gray-700 text-gray-200'
                                                    }`}>
                                                    <p className="text-xs opacity-75 mb-1 font-medium">
                                                        {msg.isInstructor ? '👨‍🏫 Instructor' : msg.userName}
                                                    </p>
                                                    <p className="text-sm">{msg.message}</p>
                                                </div>
                                            </div>
                                        )
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={sendMessage} className="p-3 border-t border-gray-700">
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-grow bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                        />
                                        <button
                                            type="submit"
                                            className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700"
                                        >
                                            <MessageSquare className="w-5 h-5" />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Participants Panel */}
                        {showParticipants && (
                            <div className="flex-grow flex flex-col">
                                <div className="p-3 border-b border-gray-700">
                                    <h3 className="text-white font-semibold">Participants ({participants.length})</h3>
                                </div>
                                <div className="flex-grow overflow-y-auto p-3">
                                    <div className="space-y-2">
                                        {participants.map((participant, idx) => (
                                            <div key={idx} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-700/50">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${participant.isInstructor ? 'bg-yellow-500' : 'bg-primary-500'
                                                    }`}>
                                                    {participant.userName?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-white text-sm font-medium">
                                                        {participant.userName}
                                                        {participant.userId === user.id && ' (You)'}
                                                    </p>
                                                    {participant.isInstructor && (
                                                        <p className="text-yellow-400 text-xs">Instructor</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {participants.length === 0 && (
                                            <p className="text-center text-gray-500 text-sm py-4">No participants yet</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="bg-gray-800 p-4 flex justify-center items-center space-x-4 shadow-lg z-10">
                <button
                    onClick={toggleAudio}
                    disabled={!localStreamRef.current?.getAudioTracks().length}
                    className={`p-4 rounded-full transition-all ${audioEnabled
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={audioEnabled ? 'Mute' : 'Unmute'}
                >
                    {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </button>

                <button
                    onClick={toggleVideo}
                    disabled={!localStreamRef.current?.getVideoTracks().length}
                    className={`p-4 rounded-full transition-all ${videoEnabled && cameraReady
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                    {videoEnabled && cameraReady ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </button>

                {cameraError && (
                    <button
                        onClick={retryCamera}
                        className="p-4 rounded-full bg-yellow-600 text-white hover:bg-yellow-700 transition-all"
                        title="Retry camera"
                    >
                        <RefreshCw className="w-6 h-6" />
                    </button>
                )}

                <button
                    onClick={handleLeave}
                    className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all px-8 flex items-center space-x-2"
                >
                    <PhoneOff className="w-6 h-6" />
                    <span className="font-semibold">{classDetails?.course?.instructorId === user.id ? 'End Class' : 'Leave'}</span>
                </button>
            </div>
        </div>
    );
};

export default LiveClass;
