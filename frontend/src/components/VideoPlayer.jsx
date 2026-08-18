import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Video, Trash2, Settings, Subtitles } from 'lucide-react';
import Hls from 'hls.js';
import { courseAPI } from '../services/api';

const VideoPlayer = ({ videos, initialVideo, onClose, canDelete, onDelete, courseId }) => {
    const [selectedVideo, setSelectedVideo] = useState(initialVideo || videos[0]);
    const videoRef = useRef(null);
    const [playbackRate, setPlaybackRate] = useState(1);
    const lastReportedProgressRef = useRef(0);

    useEffect(() => {
        if (initialVideo) {
            setSelectedVideo(initialVideo);
        }
    }, [initialVideo]);

    useEffect(() => {
        lastReportedProgressRef.current = 0;
    }, [selectedVideo]);

    const url = selectedVideo?.fileUrl;

    // Convert YouTube URL to embed URL
    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;

        // Handle youtube.com/watch?v= format
        const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([^&]+)/);
        if (watchMatch) {
            return `https://www.youtube.com/embed/${watchMatch[1]}`;
        }

        // Handle youtu.be/ format
        const shortMatch = url.match(/(?:youtu\.be\/)([^?]+)/);
        if (shortMatch) {
            return `https://www.youtube.com/embed/${shortMatch[1]}`;
        }

        // Handle youtube.com/embed/ format (already correct)
        if (url.includes('youtube.com/embed/')) {
            return url;
        }

        // Return null instead of URL for non-YouTube
        return null;
    };

    const embedUrl = getYouTubeEmbedUrl(url);
    const isHlsUrl = url && (url.endsWith('.m3u8') || url.includes('.m3u8'));

    // Handle playback speed changes
    const changePlaybackSpeed = (speed) => {
        setPlaybackRate(speed);
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
        }
    };

    // Placeholder for subtitles
    const toggleSubtitles = () => {
        console.log('Subtitles toggled (Placeholder logic)');
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current || !courseId) return;
        const video = videoRef.current;
        if (!video.duration) return;

        const currentPercent = (video.currentTime / video.duration) * 100;
        
        if (currentPercent - lastReportedProgressRef.current >= 5) {
            lastReportedProgressRef.current = currentPercent;
            courseAPI.updateProgress(courseId, Math.floor(currentPercent))
                .catch(err => console.error("Failed to update progress", err));
        }
    };

    // Load HLS or normal video source
    useEffect(() => {
        if (!embedUrl && url && videoRef.current) {
            const videoElement = videoRef.current;

            if (isHlsUrl && Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(url);
                hls.attachMedia(videoElement);
                
                return () => {
                    hls.destroy();
                };
            } else if (videoElement.canPlayType('application/vnd.apple.mpegURL')) {
                // Native HLS support (Safari)
                videoElement.src = url;
            } else {
                // Regular video format
                videoElement.src = url;
            }
        }
    }, [url, embedUrl, isHlsUrl]);

    return (
        <div className="fixed inset-0 z-50 bg-gray-900">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Course</span>
                    </button>
                    <h1 className="text-white font-semibold truncate max-w-md">
                        {selectedVideo?.title}
                    </h1>
                    <div className="w-32"></div> {/* Spacer for centering */}
                </div>
            </div>

            {/* Main Content - NPTEL Style Layout */}
            <div className="flex h-[calc(100vh-60px)]">
                {/* Video List Sidebar */}
                <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
                    <div className="p-4 border-b border-gray-700">
                        <h2 className="text-white font-semibold flex items-center gap-2">
                            <Video className="w-5 h-5 text-red-500" />
                            Course Videos ({videos.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-700">
                        {videos.map((video, index) => (
                            <div
                                key={video.id}
                                onClick={() => setSelectedVideo(video)}
                                className={`p-4 cursor-pointer transition-all ${selectedVideo?.id === video.id
                                        ? 'bg-primary-600/20 border-l-4 border-l-primary-500'
                                        : 'hover:bg-gray-700/50 border-l-4 border-l-transparent'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedVideo?.id === video.id
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-gray-700 text-gray-400'
                                        }`}>
                                        {selectedVideo?.id === video.id ? (
                                            <Play className="w-4 h-4" />
                                        ) : (
                                            <span className="text-sm font-bold">{index + 1}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`font-medium text-sm truncate ${selectedVideo?.id === video.id
                                                ? 'text-primary-400'
                                                : 'text-gray-200'
                                            }`}>
                                            {video.title}
                                        </h4>
                                        {video.description && (
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                {video.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Video Player Area */}
                <div className="flex-1 bg-gray-900 flex flex-col">
                    {/* Video Container */}
                    <div className="flex-1 flex items-center justify-center p-6 relative group">
                        {embedUrl ? (
                            <div className="w-full max-w-5xl">
                                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                    <iframe
                                        src={embedUrl}
                                        className="absolute inset-0 w-full h-full rounded-xl shadow-2xl"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        title={selectedVideo?.title}
                                    />
                                </div>
                            </div>
                        ) : url ? (
                            <div className="w-full h-full flex flex-col items-center justify-center relative">
                                <video
                                    ref={videoRef}
                                    controls
                                    className="w-full max-h-[100%] rounded-xl shadow-2xl object-cover"
                                    poster={selectedVideo?.thumbnail}
                                    title={selectedVideo?.title}
                                    onTimeUpdate={handleTimeUpdate}
                                >
                                    {/* Placeholder for subtitle track */}
                                    <track
                                        kind="subtitles"
                                        srcLang="en"
                                        label="English"
                                    />
                                    Your browser does not support the video tag.
                                </video>
                                
                                {/* Custom Overlay Controls for settings/subtitles placeholder */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="relative group/speed">
                                        <button className="bg-black/60 p-2 rounded-lg text-white hover:bg-black/80 transition-colors">
                                            <Settings className="w-5 h-5" />
                                        </button>
                                        <div className="absolute right-0 mt-2 hidden group-hover/speed:flex flex-col bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
                                            {[0.5, 1, 1.25, 1.5, 2].map((speed) => (
                                                <button
                                                    key={speed}
                                                    onClick={() => changePlaybackSpeed(speed)}
                                                    className={`px-4 py-2 text-sm text-left hover:bg-gray-700 transition-colors ${playbackRate === speed ? 'text-primary-400 bg-gray-700/50' : 'text-gray-200'}`}
                                                >
                                                    {speed}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={toggleSubtitles}
                                        className="bg-black/60 p-2 rounded-lg text-white hover:bg-black/80 transition-colors"
                                    >
                                        <Subtitles className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500">
                                <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>Unable to load video</p>
                                <p className="text-sm mt-2">URL: {url}</p>
                            </div>
                        )}
                    </div>

                    {/* Video Info Bar */}
                    <div className="bg-gray-800 border-t border-gray-700 p-4">
                        <div className="max-w-5xl mx-auto flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-white">
                                    {selectedVideo?.title}
                                </h2>
                                {selectedVideo?.description && (
                                    <p className="text-gray-400 mt-1">
                                        {selectedVideo.description}
                                    </p>
                                )}
                            </div>
                            {canDelete && onDelete && (
                                <button
                                    onClick={() => onDelete(selectedVideo.id)}
                                    className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete Video</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
