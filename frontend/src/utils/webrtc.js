class WebRTCManager {
    constructor(socket, roomId, userId, onRemoteStream) {
        this.socket = socket;
        this.roomId = roomId;
        this.userId = userId;
        this.onRemoteStream = onRemoteStream;
        this.peers = {}; // socketId -> RTCPeerConnection
        this.localStream = null;
        this.config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        };
    }

    async initialize(localVideoElement) {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            if (localVideoElement) {
                localVideoElement.srcObject = this.localStream;
            }

            this.setupSocketListeners();
            return true;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            return false;
        }
    }

    setupSocketListeners() {
        // When a new user joins, create an offer
        this.socket.on('user-joined', async ({ socketId }) => {
            console.log('User joined, creating offer for:', socketId);
            await this.createPeerConnection(socketId, true);
        });

        // Handle incoming offer
        this.socket.on('webrtc-offer', async ({ offer, senderSocketId }) => {
            console.log('Received offer from:', senderSocketId);
            await this.handleOffer(offer, senderSocketId);
        });

        // Handle incoming answer
        this.socket.on('webrtc-answer', async ({ answer, senderSocketId }) => {
            console.log('Received answer from:', senderSocketId);
            await this.handleAnswer(answer, senderSocketId);
        });

        // Handle ICE candidates
        this.socket.on('webrtc-ice-candidate', async ({ candidate, senderSocketId }) => {
            await this.handleIceCandidate(candidate, senderSocketId);
        });

        // Handle user leaving
        this.socket.on('user-left', ({ socketId }) => {
            this.closePeerConnection(socketId);
        });
    }

    async createPeerConnection(targetSocketId, isInitiator) {
        const pc = new RTCPeerConnection(this.config);
        this.peers[targetSocketId] = pc;

        // Add local tracks
        this.localStream.getTracks().forEach(track => {
            pc.addTrack(track, this.localStream);
        });

        // Handle remote tracks
        pc.ontrack = (event) => {
            console.log('Received remote track from:', targetSocketId);
            this.onRemoteStream(event.streams[0], targetSocketId);
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('webrtc-ice-candidate', {
                    roomId: this.roomId,
                    candidate: event.candidate,
                    targetSocketId
                });
            }
        };

        if (isInitiator) {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                this.socket.emit('webrtc-offer', {
                    roomId: this.roomId,
                    offer,
                    targetSocketId
                });
            } catch (error) {
                console.error('Error creating offer:', error);
            }
        }

        return pc;
    }

    async handleOffer(offer, senderSocketId) {
        const pc = await this.createPeerConnection(senderSocketId, false);

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            this.socket.emit('webrtc-answer', {
                roomId: this.roomId,
                answer,
                targetSocketId: senderSocketId
            });
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }

    async handleAnswer(answer, senderSocketId) {
        const pc = this.peers[senderSocketId];
        if (pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (error) {
                console.error('Error handling answer:', error);
            }
        }
    }

    async handleIceCandidate(candidate, senderSocketId) {
        const pc = this.peers[senderSocketId];
        if (pc) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error('Error adding ICE candidate:', error);
            }
        }
    }

    closePeerConnection(socketId) {
        if (this.peers[socketId]) {
            this.peers[socketId].close();
            delete this.peers[socketId];
        }
    }

    cleanup() {
        Object.keys(this.peers).forEach(socketId => {
            this.closePeerConnection(socketId);
        });

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
    }

    toggleAudio(enabled) {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    toggleVideo(enabled) {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }
}

export default WebRTCManager;
