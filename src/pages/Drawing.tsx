import { useState, useEffect, useRef } from 'react';
import { Save, Trash2, Undo, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';

export function DrawingPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5);
    const [savedStatus, setSavedStatus] = useState('Saved');

    useEffect(() => {
        loadDrawing();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleResize = () => {
        // TODO: Handle resize without losing drawing data
        // For now, we might just want to set canvas size once or handle it better
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
                        }
                    }
                };
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

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const rect = canvas.getBoundingClientRect();
                ctx.beginPath();
                ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                ctx.strokeStyle = color;
                ctx.lineWidth = brushSize;
                ctx.lineCap = 'round';
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
                ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                ctx.stroke();
            }
        }
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveDrawing();
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                saveDrawing();
            }
        }
    };

    return (
        <div className="p-6 h-full flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Drawing Board</h1>
                    <p className="text-gray-500 dark:text-gray-400">Sketch your ideas</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{savedStatus}</span>
                    <button
                        onClick={clearCanvas}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors"
                        title="Clear Canvas"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-gray-500" />
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Size:</span>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-32"
                    />
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                <canvas
                    ref={canvasRef}
                    width={1200}
                    height={800}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full h-full cursor-crosshair touch-none"
                />
            </div>
        </div>
    );
}
