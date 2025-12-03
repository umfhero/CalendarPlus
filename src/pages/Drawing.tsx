import { useState, useEffect, useRef } from 'react';
import { Trash2, Undo, Redo } from 'lucide-react';
import { motion } from 'framer-motion';

export function DrawingPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5);
    const [savedStatus, setSavedStatus] = useState('Saved');
    
    // History for Undo/Redo
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    const startPos = useRef<{x: number, y: number} | null>(null);
    const snapshot = useRef<ImageData | null>(null);

    useEffect(() => {
        loadDrawing();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                undo();
            }
            if (e.ctrlKey && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
            }
            if (e.key === 'Delete') {
                e.preventDefault();
                clearCanvas();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history, historyIndex]);

    const handleResize = () => {
        // TODO: Handle resize without losing drawing data
    };

    const addToHistory = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const dataUrl = canvas.toDataURL();
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(dataUrl);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
    };

    const loadDrawing = async () => {
        try {
            // @ts-ignore
            const data = await window.ipcRenderer.invoke('get-drawing');
            if (data) {
                const img = new Image();
                img.src = data;
                img.onload = () => {
                    const canvas = canvasRef.current;
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            // Initialize history with loaded image
                            const dataUrl = canvas.toDataURL();
                            setHistory([dataUrl]);
                            setHistoryIndex(0);
                        }
                    }
                };
            } else {
                // Initialize history with blank canvas
                const canvas = canvasRef.current;
                if (canvas) {
                    const dataUrl = canvas.toDataURL();
                    setHistory([dataUrl]);
                    setHistoryIndex(0);
                }
            }
        } catch (e) {
            console.error('Failed to load drawing', e);
        }
    };

    const saveDrawing = async () => {
        const canvas = canvasRef.current;
        if (canvas) {
            setSavedStatus('Saving...');
            const data = canvas.toDataURL();
            try {
                // @ts-ignore
                await window.ipcRenderer.invoke('save-drawing', data);
                setSavedStatus('Saved');
            } catch (e) {
                console.error('Failed to save drawing', e);
                setSavedStatus('Error saving');
            }
        }
    };

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            restoreState(history[newIndex]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            restoreState(history[newIndex]);
        }
    };

    const restoreState = (dataUrl: string) => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const img = new Image();
                img.src = dataUrl;
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    saveDrawing();
                };
            }
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                
                startPos.current = { x, y };
                snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.strokeStyle = color;
                ctx.lineWidth = brushSize;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                if (!e.shiftKey && !e.ctrlKey) {
                    // Draw a dot immediately
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
                
                setIsDrawing(true);
            }
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                let x = (e.clientX - rect.left) * scaleX;
                let y = (e.clientY - rect.top) * scaleY;

                if (startPos.current && snapshot.current) {
                    if (e.shiftKey) {
                        ctx.putImageData(snapshot.current, 0, 0);
                        ctx.beginPath();
                        const width = x - startPos.current.x;
                        const height = y - startPos.current.y;
                        ctx.rect(startPos.current.x, startPos.current.y, width, height);
                        ctx.stroke();
                    } else if (e.ctrlKey) {
                        ctx.putImageData(snapshot.current, 0, 0);
                        ctx.beginPath();
                        ctx.moveTo(startPos.current.x, startPos.current.y);

                        // Calculate angle and distance
                        const dx = x - startPos.current.x;
                        const dy = y - startPos.current.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const angle = Math.atan2(dy, dx);

                        // Snap angle to nearest 45 degrees (PI/4)
                        const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
                        
                        const snapX = startPos.current.x + distance * Math.cos(snapAngle);
                        const snapY = startPos.current.y + distance * Math.sin(snapAngle);

                        ctx.lineTo(snapX, snapY);
                        ctx.stroke();
                    } else {
                        ctx.lineTo(x, y);
                        ctx.stroke();
                    }
                }
            }
        }
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            addToHistory();
            saveDrawing();
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                addToHistory();
                saveDrawing();
            }
        }
    };

    return (
        <div className="h-full flex flex-col relative bg-gray-50 dark:bg-gray-900">
            <div className="absolute top-6 left-6 z-10">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Drawing Board</h1>
                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    Sketch your ideas
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {savedStatus}
                    </span>
                </p>
            </div>

            <div className="flex-1 overflow-hidden relative cursor-crosshair">
                <canvas
                    ref={canvasRef}
                    width={1920}
                    height={1080}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-full touch-none bg-white dark:bg-gray-800"
                />
            </div>

            {/* Floating Toolbar */}
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-4 z-20 max-w-[90vw] overflow-x-auto"
            >
                <div className="flex items-center gap-3">
                    <div 
                        className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600 overflow-hidden cursor-pointer relative shadow-sm"
                        style={{ backgroundColor: color }}
                    >
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                    </div>
                </div>
                
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase">Size</span>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-32 accent-blue-500"
                    />
                    <div 
                        className="rounded-full bg-gray-900 dark:bg-white"
                        style={{ width: Math.min(brushSize, 24), height: Math.min(brushSize, 24) }}
                    />
                </div>

                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

                <div className="flex items-center gap-2">
                    <button
                        onClick={undo}
                        disabled={historyIndex <= 0}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-50 transition-colors"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo className="w-5 h-5" />
                    </button>
                    <button
                        onClick={redo}
                        disabled={historyIndex >= history.length - 1}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-50 transition-colors"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo className="w-5 h-5" />
                    </button>
                    <button
                        onClick={clearCanvas}
                        className="p-2 rounded-xl hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
                        title="Clear Canvas (Del)"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
