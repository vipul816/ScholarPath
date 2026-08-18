import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { Class, Course, Enrollment, User } from './models/index.js';

// Socket.io event handlers for real-time features

// Store for active classes and their participants
const activeClasses = new Map(); // classId -> { isLive: boolean, hostSocketId: string, participants: [] }

const extractTokenFromSocket = (socket) => {
    const authToken = socket.handshake?.auth?.token;
    if (authToken) {
        return authToken;
    }

    const headerToken = socket.handshake?.headers?.authorization;
    if (!headerToken) {
        return null;
    }

    return headerToken.replace('Bearer ', '');
};

const resolveSocketUser = async (socket) => {
    try {
        const token = extractTokenFromSocket(socket);
        if (!token || !process.env.JWT_SECRET) {
            return null;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role === 'admin') {
            return {
                id: decoded.id ?? 0,
                name: decoded.name || 'Administrator',
                role: 'admin'
            };
        }

        if (!decoded.id) {
            return null;
        }

        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'name', 'role']
        });

        if (!user) {
            return null;
        }

        return user.toJSON();
    } catch (error) {
        return null;
    }
};

const ensureActiveClass = (classId) => {
    if (!activeClasses.has(classId)) {
        activeClasses.set(classId, {
            isLive: false,
            hostSocketId: null,
            participants: []
        });
    }

    return activeClasses.get(classId);
};

const upsertParticipant = (classData, socket, user, isInstructor) => {
    const existingParticipant = classData.participants.find((participant) => participant.userId === user.id);

    if (!existingParticipant) {
        classData.participants.push({
            socketId: socket.id,
            userId: user.id,
            userName: user.name,
            isInstructor
        });
    } else {
        existingParticipant.socketId = socket.id;
        existingParticipant.userName = user.name;
        existingParticipant.isInstructor = isInstructor;
    }

    if (isInstructor) {
        classData.hostSocketId = socket.id;
    }
};

const getClassAccess = async (classId, user) => {
    const classRecord = await Class.findByPk(classId, {
        include: [
            {
                model: Course,
                as: 'course',
                attributes: ['id', 'instructorId']
            }
        ]
    });

    if (!classRecord || !classRecord.course) {
        return {
            allowed: false,
            reason: 'Class not found'
        };
    }

    if (user.role === 'admin') {
        return {
            allowed: true,
            isInstructor: false
        };
    }

    const isInstructor = classRecord.course.instructorId === user.id;
    if (isInstructor) {
        return {
            allowed: true,
            isInstructor: true
        };
    }

    if (user.role !== 'student') {
        return {
            allowed: false,
            reason: 'Only enrolled students can join this class'
        };
    }

    const enrollment = await Enrollment.findOne({
        where: {
            studentId: user.id,
            courseId: classRecord.courseId,
            status: {
                [Op.ne]: 'dropped'
            }
        }
    });

    if (!enrollment) {
        return {
            allowed: false,
            reason: 'You are not enrolled in this course'
        };
    }

    return {
        allowed: true,
        isInstructor: false
    };
};

export const setupSocketHandlers = (io) => {
    io.on('connection', async (socket) => {
        const authUser = await resolveSocketUser(socket);

        if (!authUser) {
            socket.emit('auth-error', {
                message: 'Socket authentication failed. Please login again.'
            });
            socket.disconnect(true);
            return;
        }

        socket.authUser = authUser;
        console.log(`✅ User connected: ${socket.id} (${authUser.name}, ${authUser.role})`);

        // Join a class room
        socket.on('join-class', async ({ roomId, classId }) => {
            const parsedClassId = Number(classId);

            if (!roomId || Number.isNaN(parsedClassId)) {
                socket.emit('class-access-denied', {
                    message: 'Invalid class room details'
                });
                return;
            }

            const access = await getClassAccess(parsedClassId, socket.authUser);
            if (!access.allowed) {
                socket.emit('class-access-denied', {
                    message: access.reason
                });
                return;
            }

            socket.join(roomId);
            console.log(`User ${socket.authUser.name} (${socket.authUser.id}) joined room: ${roomId}`);

            // Store user info on socket
            socket.userData = {
                roomId,
                classId: parsedClassId,
                userId: socket.authUser.id,
                userName: socket.authUser.name,
                isInstructor: access.isInstructor
            };

            const classData = ensureActiveClass(parsedClassId);
            upsertParticipant(classData, socket, socket.authUser, access.isInstructor);

            // Notify others in the room
            socket.to(roomId).emit('user-joined', {
                userId: socket.authUser.id,
                userName: socket.authUser.name,
                isInstructor: access.isInstructor,
                socketId: socket.id
            });

            // Send updated participants list to everyone
            io.to(roomId).emit('participants-update', {
                participants: classData.participants,
                count: classData.participants.length
            });
        });

        // Check if class is live (for students joining)
        socket.on('check-class-status', async ({ classId }) => {
            const parsedClassId = Number(classId);
            if (Number.isNaN(parsedClassId)) {
                return;
            }

            const access = await getClassAccess(parsedClassId, socket.authUser);
            if (!access.allowed) {
                socket.emit('class-access-denied', {
                    message: access.reason
                });
                return;
            }

            const classData = activeClasses.get(parsedClassId);
            socket.emit('class-status', {
                isLive: classData?.isLive || false
            });
        });

        // Instructor starts the class
        socket.on('start-class', async ({ roomId, classId }) => {
            const parsedClassId = Number(classId);
            if (!roomId || Number.isNaN(parsedClassId)) {
                return;
            }

            const access = await getClassAccess(parsedClassId, socket.authUser);
            if (!access.allowed || !access.isInstructor) {
                socket.emit('class-access-denied', {
                    message: 'Only the class instructor can start this class'
                });
                return;
            }

            const classData = ensureActiveClass(parsedClassId);
            upsertParticipant(classData, socket, socket.authUser, true);
            classData.isLive = true;
            classData.hostSocketId = socket.id;

            // Update class status in database
            try {
                await Class.update(
                    { status: 'ongoing' },
                    { where: { id: parsedClassId } }
                );
            } catch (error) {
                console.error('Error updating class status to ongoing:', error);
            }

            io.to(roomId).emit('class-started');
            io.to(roomId).emit('participants-update', {
                participants: classData.participants,
                count: classData.participants.length
            });
            console.log(`Class ${parsedClassId} started`);
        });

        // Instructor ends the class
        socket.on('end-class', async ({ roomId, classId }) => {
            const parsedClassId = Number(classId);
            if (!roomId || Number.isNaN(parsedClassId)) {
                return;
            }

            const access = await getClassAccess(parsedClassId, socket.authUser);
            if (!access.allowed || !access.isInstructor) {
                socket.emit('class-access-denied', {
                    message: 'Only the class instructor can end this class'
                });
                return;
            }

            const classData = activeClasses.get(parsedClassId);
            if (classData) {
                classData.isLive = false;
                
                // Update class status in database
                try {
                    await Class.update(
                        { status: 'completed' },
                        { where: { id: parsedClassId } }
                    );
                } catch (error) {
                    console.error('Error updating class status to completed:', error);
                }
                
                io.to(roomId).emit('class-ended');
                console.log(`Class ${parsedClassId} ended`);
            }
        });

        // Leave a class room
        socket.on('leave-class', ({ roomId }) => {
            const resolvedRoomId = socket.userData?.roomId || roomId;
            if (!resolvedRoomId) {
                return;
            }

            socket.leave(resolvedRoomId);
            console.log(`User ${socket.authUser.name} (${socket.authUser.id}) left room: ${resolvedRoomId}`);

            // Remove from participants
            if (socket.userData?.classId) {
                const classData = activeClasses.get(socket.userData.classId);
                if (classData) {
                    classData.participants = classData.participants.filter((participant) => participant.userId !== socket.authUser.id);

                    // Notify others
                    socket.to(resolvedRoomId).emit('user-left', {
                        userId: socket.authUser.id,
                        userName: socket.authUser.name,
                        socketId: socket.id
                    });

                    // Send updated participants
                    io.to(resolvedRoomId).emit('participants-update', {
                        participants: classData.participants,
                        count: classData.participants.length
                    });

                    if (classData.participants.length === 0) {
                        activeClasses.delete(socket.userData.classId);
                    }
                }
            }
        });

        // Whiteboard drawing events
        socket.on('whiteboard-draw', ({ roomId, drawData }) => {
            if (!socket.userData || socket.userData.roomId !== roomId) {
                return;
            }
            socket.to(roomId).emit('whiteboard-draw', drawData);
        });

        socket.on('whiteboard-clear', ({ roomId }) => {
            if (!socket.userData || socket.userData.roomId !== roomId) {
                return;
            }
            socket.to(roomId).emit('whiteboard-clear');
        });

        socket.on('whiteboard-undo', ({ roomId }) => {
            if (!socket.userData || socket.userData.roomId !== roomId) {
                return;
            }
            socket.to(roomId).emit('whiteboard-undo');
        });

        socket.on('chat-message', ({ roomId, message }) => {
            if (!socket.userData || socket.userData.roomId !== roomId) {
                return;
            }

            const messageText = String(message || '').trim();
            if (!messageText) {
                return;
            }

            const chatMessage = {
                id: `${Date.now()}-${socket.id}`,
                userId: socket.authUser.id,
                userName: socket.authUser.name,
                message: messageText,
                isInstructor: socket.userData.isInstructor || false,
                timestamp: new Date().toISOString()
            };

            // Broadcast to ALL users in room including sender
            io.to(roomId).emit('chat-message', chatMessage);
        });

        // WebRTC signaling for video/audio
        socket.on('webrtc-offer', ({ roomId, offer, targetSocketId }) => {
            if (!socket.userData || socket.userData.roomId !== roomId) {
                return;
            }

            socket.to(targetSocketId).emit('webrtc-offer', {
                offer,
                senderSocketId: socket.id
            });
        });

        socket.on('webrtc-answer', ({ roomId, answer, targetSocketId }) => {
            if (!socket.userData || socket.userData.roomId !== roomId) {
                return;
            }

            socket.to(targetSocketId).emit('webrtc-answer', {
                answer,
                senderSocketId: socket.id
            });
        });

        socket.on('webrtc-ice-candidate', ({ roomId, candidate, targetSocketId }) => {
            if (!socket.userData || socket.userData.roomId !== roomId) {
                return;
            }

            socket.to(targetSocketId).emit('webrtc-ice-candidate', {
                candidate,
                senderSocketId: socket.id
            });
        });

        // Screen sharing toggle
        socket.on('screen-share-start', ({ roomId }) => {
            if (!socket.userData || socket.userData.roomId !== roomId) {
                return;
            }

            socket.to(roomId).emit('screen-share-start', {
                userId: socket.authUser.id,
                userName: socket.authUser.name,
                socketId: socket.id
            });
        });

        socket.on('screen-share-stop', ({ roomId }) => {
            if (!socket.userData || socket.userData.roomId !== roomId) {
                return;
            }

            socket.to(roomId).emit('screen-share-stop', {
                userId: socket.authUser.id,
                socketId: socket.id
            });
        });

        // Disconnect event
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.id}`);

            // Clean up participant from any class they were in
            if (socket.userData) {
                const { roomId, classId, userId, userName } = socket.userData;
                const classData = activeClasses.get(classId);

                if (classData) {
                    classData.participants = classData.participants.filter((participant) => participant.socketId !== socket.id);

                    // Notify others
                    socket.to(roomId).emit('user-left', {
                        userId,
                        userName,
                        socketId: socket.id
                    });

                    // Send updated participants
                    io.to(roomId).emit('participants-update', {
                        participants: classData.participants,
                        count: classData.participants.length
                    });

                    // If instructor disconnects, end the class
                    if (classData.hostSocketId === socket.id) {
                        classData.isLive = false;
                        io.to(roomId).emit('class-ended');
                    }

                    // Clean up empty classes
                    if (classData.participants.length === 0) {
                        activeClasses.delete(classId);
                    }
                }
            }
        });
    });
};
