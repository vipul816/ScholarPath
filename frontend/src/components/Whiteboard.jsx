import { useEffect, useRef, useState } from 'react';
import { Eraser, Pen, Square, Circle, Download, Trash2, Undo } from 'lucide-react';

const Whiteboard = ({ socket, roomId, isReadOnly = false }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState('pen');
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(2);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            // Restore drawing after resize if needed
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Socket event listeners
        if (socket) {
            socket.on('whiteboard-draw', (data) => {
                drawOnCanvas(data, false);
            });

            socket.on('whiteboard-clear', () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setHistory([]);
            });
        }

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (socket) {
                socket.off('whiteboard-draw');
                socket.off('whiteboard-clear');
            }
        };
    }, [socket]);

    const startDrawing = (e) => {
        if (isReadOnly) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDrawing(true);

        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
        ctx.lineCap = 'round';
    };

    const draw = (e) => {
        if (!isDrawing || isReadOnly) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();

        // Emit drawing data
        if (socket) {
            socket.emit('whiteboard-draw', {
                roomId,
                drawData: {
                    x,
                    y,
                    color: tool === 'eraser' ? '#ffffff' : color,
                    lineWidth: tool === 'eraser' ? 20 : lineWidth,
                    type: 'draw'
                }
            });
        }
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            const canvas = canvasRef.current;
            // Save state for undo functionality (simplified)
            setHistory([...history, canvas.toDataURL()]);
        }
    };

    const drawOnCanvas = (data, emit = true) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Implementation for remote drawing
        // This is a simplified version - for production, you'd want to handle paths properly
        ctx.lineWidth = data.lineWidth;
        ctx.strokeStyle = data.color;
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHistory([]);

        if (socket) {
            socket.emit('whiteboard-clear', { roomId });
        }
    };

    const downloadCanvas = () => {
        const canvas = canvasRef.current;
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'whiteboard.png';
        link.href = url;
        link.click();
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Toolbar */}
            {!isReadOnly && (
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setTool('pen')}
                            className={`p-2 rounded-lg ${tool === 'pen' ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-200'}`}
                            title="Pen"
                        >
                            <Pen className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setTool('eraser')}
                            className={`p-2 rounded-lg ${tool === 'eraser' ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-200'}`}
                            title="Eraser"
                        >
                            <Eraser className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-2"></div>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-0"
                            title="Color"
                        />
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={lineWidth}
                            onChange={(e) => setLineWidth(parseInt(e.target.value))}
                            className="w-24"
                            title="Brush Size"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={clearCanvas}
                            className="p-2 rounded-lg hover:bg-red-100 text-red-600"
                            title="Clear Board"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={downloadCanvas}
                            className="p-2 rounded-lg hover:bg-gray-200"
                            title="Save as Image"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Canvas Area */}
            <div className="flex-grow relative bg-white cursor-crosshair">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    className="absolute inset-0 w-full h-full"
                />
            </div>
        </div>
    );
};

export default Whiteboard;
