import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, Calculator, BookOpen, Sparkles, X, List, Image as ImageIcon, Mic, Link as LinkIcon, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

// --- Types ---
interface StickyNote {
    id: string;
    type: 'text' | 'list' | 'image' | 'audio' | 'link';
    x: number;
    y: number;
    width: number;
    height: number;
    content: string;
    title?: string;
    color: string;
    paperStyle: 'smooth' | 'lined' | 'grid';
    tapeStyle: 'orange' | 'blue' | 'green' | 'purple' | 'none';
    font: 'modern' | 'serif' | 'handwritten' | 'script';
    fontSize: number;
    listItems?: { id: string; text: string; checked: boolean }[];
    audioUrl?: string;
    linkUrl?: string;
}

interface Board {
    id: string;
    name: string;
    color: string;
    notes: StickyNote[];
}

// --- Constants ---
const COLORS = [
    { name: 'Cozy Cream', value: '#FFF8DC' },
    { name: 'Soft Beige', value: '#F5F5DC' },
    { name: 'Cloud Gray', value: '#E8E8E8' },
    { name: 'Pale Mint', value: '#E0F2E9' },
    { name: 'Sky Whisper', value: '#E6F3FF' },
    { name: 'Soft Lavender', value: '#E6E6FA' },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

// --- Main Component ---
export function BoardPage({ refreshTrigger }: { refreshTrigger?: number }) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [boards, setBoards] = useState<Board[]>([{
        id: generateId(),
        name: 'My Board',
        color: '#A78BFA',
        notes: []
    }]);
    const [activeBoardId, setActiveBoardId] = useState<string>(boards[0]?.id);
    const [notes, setNotes] = useState<StickyNote[]>([]);

    // Canvas state
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // Note interaction
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [draggedNote, setDraggedNote] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
    const [resizingNote, setResizingNote] = useState<{ id: string; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);

    // Modals
    const [showAddNoteModal, setShowAddNoteModal] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);
    const [showDictionary, setShowDictionary] = useState(false);
    const [showAIDraft, setShowAIDraft] = useState(false);

    // Add note config
    const [noteConfig, setNoteConfig] = useState({
        type: 'text' as 'text' | 'list' | 'image' | 'audio' | 'link',
        isSingle: true,
        paperStyle: 'smooth' as const,
        tapeStyle: 'orange' as const,
        color: COLORS[0].value,
    });

    const activeBoard = boards.find(b => b.id === activeBoardId) || boards[0];

    // --- Load/Save ---
    useEffect(() => {
        loadData();
    }, [refreshTrigger]);

    useEffect(() => {
        const timeout = setTimeout(saveData, 1000);
        return () => clearTimeout(timeout);
    }, [boards, notes]);

    const loadData = async () => {
        try {
            // @ts-ignore
            const data = await window.ipcRenderer.invoke('get-boards');
            if (data && data.boards) {
                setBoards(data.boards);
                setActiveBoardId(data.activeBoardId || data.boards[0]?.id);
                const current = data.boards.find((b: Board) => b.id === (data.activeBoardId || data.boards[0]?.id));
                setNotes(current?.notes || []);
            }
        } catch (e) {
            console.error('Failed to load boards:', e);
        }
    };

    const saveData = async () => {
        try {
            const updatedBoards = boards.map(b =>
                b.id === activeBoardId ? { ...b, notes } : b
            );
            // @ts-ignore
            await window.ipcRenderer.invoke('save-boards', { boards: updatedBoards, activeBoardId });
        } catch (e) {
            console.error('Failed to save boards:', e);
        }
    };

    // --- Canvas Pan & Zoom ---
    const handleWheel = useCallback((e: WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(prev => Math.max(0.1, Math.min(3, prev * delta)));
        } else {
            setPanOffset(prev => ({
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY
            }));
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('wheel', handleWheel, { passive: false });
            return () => canvas.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel]);

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.target === canvasRef.current)) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
            setSelectedNoteId(null);
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setPanOffset({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
        } else if (draggedNote) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                const x = (e.clientX - rect.left - panOffset.x - draggedNote.offsetX) / zoom;
                const y = (e.clientY - rect.top - panOffset.y - draggedNote.offsetY) / zoom;
                setNotes(prev => prev.map(n =>
                    n.id === draggedNote.id ? { ...n, x, y } : n
                ));
            }
        } else if (resizingNote) {
            const dx = (e.clientX - resizingNote.startX) / zoom;
            const dy = (e.clientY - resizingNote.startY) / zoom;
            setNotes(prev => prev.map(n =>
                n.id === resizingNote.id
                    ? {
                        ...n,
                        width: Math.max(150, resizingNote.startWidth + dx),
                        height: Math.max(100, resizingNote.startHeight + dy)
                    }
                    : n
            ));
        }
    };

    const handleCanvasMouseUp = () => {
        setIsPanning(false);
        setDraggedNote(null);
        setResizingNote(null);
    };

    // --- Note Management ---
    const addNote = () => {
        const newNote: StickyNote = {
            id: generateId(),
            type: noteConfig.type,
            x: -panOffset.x / zoom + 100,
            y: -panOffset.y / zoom + 100,
            width: 250,
            height: 200,
            content: '',
            color: noteConfig.color,
            paperStyle: noteConfig.paperStyle,
            tapeStyle: noteConfig.tapeStyle,
            font: 'modern',
            fontSize: 16,
            listItems: noteConfig.type === 'list' ? [{ id: generateId(), text: '', checked: false }] : undefined
        };
        setNotes(prev => [...prev, newNote]);
        setShowAddNoteModal(false);
        setSelectedNoteId(newNote.id);
    };

    const deleteNote = (id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
        if (selectedNoteId === id) setSelectedNoteId(null);
    };

    const handleNoteMouseDown = (e: React.MouseEvent, noteId: string) => {
        e.stopPropagation();
        const note = notes.find(n => n.id === noteId);
        if (note) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
                const offsetX = (e.clientX - rect.left - panOffset.x) / zoom - note.x;
                const offsetY = (e.clientY - rect.top - panOffset.y) / zoom - note.y;
                setDraggedNote({ id: noteId, offsetX, offsetY });
                setSelectedNoteId(noteId);
            }
        }
    };

    const handleResizeStart = (e: React.MouseEvent, noteId: string) => {
        e.stopPropagation();
        const note = notes.find(n => n.id === noteId);
        if (note) {
            setResizingNote({
                id: noteId,
                startX: e.clientX,
                startY: e.clientY,
                startWidth: note.width,
                startHeight: note.height
            });
        }
    };

    // --- Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && selectedNoteId) {
                deleteNote(selectedNoteId);
            }
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'k') {
                    e.preventDefault();
                    setShowSearchModal(true);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNoteId]);

    return (
        <div className="h-full flex flex-col bg-[#F5F1E8] dark:bg-gray-900 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <input
                        value={activeBoard.name}
                        onChange={(e) => setBoards(prev => prev.map(b =>
                            b.id === activeBoardId ? { ...b, name: e.target.value } : b
                        ))}
                        className="text-2xl font-bold bg-transparent border-none focus:outline-none text-gray-800 dark:text-gray-100"
                    />
                </div>

                {/* Board Tabs */}
                <div className="flex items-center gap-2">
                    {boards.map(board => (
                        <motion.button
                            key={board.id}
                            onClick={() => {
                                setActiveBoardId(board.id);
                                setNotes(board.notes);
                            }}
                            className={clsx(
                                "px-4 py-2 rounded-lg font-medium transition-all",
                                board.id === activeBoardId
                                    ? "bg-purple-500 text-white shadow-lg"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                            )}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {board.name}
                        </motion.button>
                    ))}
                </div>

                {/* Add Note Button */}
                <motion.button
                    onClick={() => setShowAddNoteModal(true)}
                    className="bg-purple-500 text-white p-3 rounded-full shadow-lg hover:bg-purple-600 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <Plus className="w-6 h-6" />
                </motion.button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-center gap-2 px-6 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
                <ToolbarButton icon={Search} label="Search" onClick={() => setShowSearchModal(true)} />
                <ToolbarButton icon={Calculator} label="Calculator" onClick={() => setShowCalculator(true)} />
                <ToolbarButton icon={BookOpen} label="Dictionary" onClick={() => setShowDictionary(true)} />
                <ToolbarButton icon={Sparkles} label="AI Draft" onClick={() => setShowAIDraft(true)} />
            </div>

            {/* Canvas */}
            <div
                ref={canvasRef}
                className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
            >
                <div
                    style={{
                        transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                        transformOrigin: '0 0',
                        width: '100%',
                        height: '100%',
                        position: 'relative'
                    }}
                >
                    {notes.map(note => (
                        <StickyNoteComponent
                            key={note.id}
                            note={note}
                            isSelected={selectedNoteId === note.id}
                            onMouseDown={(e) => handleNoteMouseDown(e, note.id)}
                            onResizeStart={(e) => handleResizeStart(e, note.id)}
                            onDelete={() => deleteNote(note.id)}
                            onChange={(updates) => setNotes(prev => prev.map(n =>
                                n.id === note.id ? { ...n, ...updates } : n
                            ))}
                        />
                    ))}
                </div>
            </div>

            {/* Modals */}
            <AddNoteModal
                isOpen={showAddNoteModal}
                onClose={() => setShowAddNoteModal(false)}
                config={noteConfig}
                setConfig={setNoteConfig}
                onAdd={addNote}
            />

            <SearchModal
                isOpen={showSearchModal}
                onClose={() => setShowSearchModal(false)}
                notes={notes}
                onSelectNote={(id) => {
                    setSelectedNoteId(id);
                    setShowSearchModal(false);
                }}
            />

            <CalculatorModal
                isOpen={showCalculator}
                onClose={() => setShowCalculator(false)}
            />

            <DictionaryModal
                isOpen={showDictionary}
                onClose={() => setShowDictionary(false)}
            />

            <AIDraftModal
                isOpen={showAIDraft}
                onClose={() => setShowAIDraft(false)}
            />
        </div>
    );
}

// --- Toolbar Button Component ---
function ToolbarButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
    return (
        <motion.button
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all text-gray-700 dark:text-gray-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{label}</span>
        </motion.button>
    );
}

// --- Sticky Note Component ---
function StickyNoteComponent({
    note,
    isSelected,
    onMouseDown,
    onResizeStart,
    onDelete,
    onChange
}: {
    note: StickyNote;
    isSelected: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
    onResizeStart: (e: React.MouseEvent) => void;
    onDelete: () => void;
    onChange: (updates: Partial<StickyNote>) => void;
}) {
    const getTapeColor = () => {
        switch (note.tapeStyle) {
            case 'orange': return '#FF8C42';
            case 'blue': return '#4A90E2';
            case 'green': return '#7ED321';
            case 'purple': return '#A78BFA';
            default: return 'transparent';
        }
    };

    const getFontFamily = () => {
        switch (note.font) {
            case 'modern': return 'Inter, sans-serif';
            case 'serif': return 'Georgia, serif';
            case 'handwritten': return 'Comic Sans MS, cursive';
            case 'script': return 'Brush Script MT, cursive';
            default: return 'Inter, sans-serif';
        }
    };

    return (
        <motion.div
            style={{
                position: 'absolute',
                left: note.x,
                top: note.y,
                width: note.width,
                height: note.height,
            }}
            className={clsx(
                "rounded-lg shadow-lg transition-shadow cursor-move",
                isSelected && "ring-4 ring-purple-400 shadow-2xl"
            )}
            onMouseDown={onMouseDown}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
        >
            {/* Tape */}
            {note.tapeStyle !== 'none' && (
                <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 rounded-sm opacity-80"
                    style={{ backgroundColor: getTapeColor() }}
                />
            )}

            {/* Note Content */}
            <div
                className="w-full h-full p-4 rounded-lg overflow-hidden"
                style={{
                    backgroundColor: note.color,
                    backgroundImage: note.paperStyle === 'lined'
                        ? 'repeating-linear-gradient(transparent, transparent 29px, #ccc 29px, #ccc 30px)'
                        : note.paperStyle === 'grid'
                            ? 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)'
                            : 'none',
                    backgroundSize: note.paperStyle === 'grid' ? '20px 20px' : 'auto'
                }}
            >
                <textarea
                    value={note.content}
                    onChange={(e) => onChange({ content: e.target.value })}
                    className="w-full h-full bg-transparent border-none focus:outline-none resize-none"
                    style={{
                        fontFamily: getFontFamily(),
                        fontSize: `${note.fontSize}px`,
                        lineHeight: note.paperStyle === 'lined' ? '30px' : '1.5'
                    }}
                    placeholder="Type here..."
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {/* Controls */}
            {isSelected && (
                <>
                    <motion.button
                        onClick={onDelete}
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                    >
                        <X className="w-4 h-4" />
                    </motion.button>

                    <motion.div
                        onMouseDown={onResizeStart}
                        className="absolute -bottom-3 -right-3 bg-purple-500 text-white rounded-full p-2 shadow-lg cursor-nwse-resize hover:bg-purple-600"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                    >
                        <div className="w-4 h-4 flex items-center justify-center">⤡</div>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
}

// --- Add Note Modal ---
function AddNoteModal({
    isOpen,
    onClose,
    config,
    setConfig,
    onAdd
}: {
    isOpen: boolean;
    onClose: () => void;
    config: any;
    setConfig: (config: any) => void;
    onAdd: () => void;
}) {
    if (!isOpen) return null;

    return (
        <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-96 shadow-2xl"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Add Note</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Single/Group Toggle */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setConfig({ ...config, isSingle: true })}
                        className={clsx(
                            "flex-1 py-2 rounded-lg font-medium transition-all",
                            config.isSingle ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-700"
                        )}
                    >
                        Single Note
                    </button>
                    <button
                        onClick={() => setConfig({ ...config, isSingle: false })}
                        className={clsx(
                            "flex-1 py-2 rounded-lg font-medium transition-all",
                            !config.isSingle ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-700"
                        )}
                    >
                        Group Notes
                    </button>
                </div>

                {/* Paper Style */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Paper Style</label>
                    <select
                        value={config.paperStyle}
                        onChange={(e) => setConfig({ ...config, paperStyle: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    >
                        <option value="smooth">Smooth</option>
                        <option value="lined">Lined</option>
                        <option value="grid">Grid</option>
                    </select>
                </div>

                {/* Tape Style */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tape Style</label>
                    <select
                        value={config.tapeStyle}
                        onChange={(e) => setConfig({ ...config, tapeStyle: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    >
                        <option value="orange">Orange Tape</option>
                        <option value="blue">Blue Tape</option>
                        <option value="green">Green Tape</option>
                        <option value="purple">Purple Tape</option>
                        <option value="none">No Tape</option>
                    </select>
                </div>

                {/* Color Picker */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Choose color</label>
                    <div className="flex gap-2">
                        {COLORS.map(color => (
                            <button
                                key={color.value}
                                onClick={() => setConfig({ ...config, color: color.value })}
                                className={clsx(
                                    "w-12 h-12 rounded-lg transition-all",
                                    config.color === color.value && "ring-4 ring-purple-400"
                                )}
                                style={{ backgroundColor: color.value }}
                            />
                        ))}
                    </div>
                </div>

                {/* Extras */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Extras</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setConfig({ ...config, type: 'list' })}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <List className="w-5 h-5" />
                            <span>List</span>
                        </button>
                        <button
                            onClick={() => setConfig({ ...config, type: 'image' })}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <ImageIcon className="w-5 h-5" />
                            <span>Image</span>
                        </button>
                        <button
                            onClick={() => setConfig({ ...config, type: 'audio' })}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <Mic className="w-5 h-5" />
                            <span>Audio</span>
                        </button>
                        <button
                            onClick={() => setConfig({ ...config, type: 'link' })}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <LinkIcon className="w-5 h-5" />
                            <span>Link</span>
                        </button>
                    </div>
                </div>

                {/* Chat with AI */}
                <button
                    onClick={onAdd}
                    className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                >
                    <MessageSquare className="w-5 h-5" />
                    Create Note
                </button>
            </motion.div>
        </motion.div>
    );
}

// --- Search Modal ---
function SearchModal({
    isOpen,
    onClose,
    notes,
    onSelectNote
}: {
    isOpen: boolean;
    onClose: () => void;
    notes: StickyNote[];
    onSelectNote: (id: string) => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const filteredNotes = notes.filter(note =>
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search notes with AI-powered semantic search... (Cmd+K)"
                            className="flex-1 bg-transparent border-none focus:outline-none text-gray-800 dark:text-gray-200"
                            autoFocus
                        />
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="max-h-96 overflow-y-auto p-4">
                    {filteredNotes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No notes found</div>
                    ) : (
                        <div className="space-y-2">
                            {filteredNotes.map(note => (
                                <button
                                    key={note.id}
                                    onClick={() => onSelectNote(note.id)}
                                    className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded">
                                            {note.type}
                                        </span>
                                        {note.title && <span className="font-medium text-gray-800 dark:text-gray-200">{note.title}</span>}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{note.content}</p>
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="text-right text-sm text-gray-500 mt-4">{filteredNotes.length} results</div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// --- Calculator Modal ---
function CalculatorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [display, setDisplay] = useState('0');
    const [equation, setEquation] = useState('');

    if (!isOpen) return null;

    const handleNumber = (num: string) => {
        setDisplay(prev => prev === '0' ? num : prev + num);
    };

    const handleOperator = (op: string) => {
        setEquation(display + ' ' + op + ' ');
        setDisplay('0');
    };

    const calculate = () => {
        try {
            const result = eval(equation + display);
            setDisplay(String(result));
            setEquation('');
        } catch {
            setDisplay('Error');
        }
    };

    const clear = () => {
        setDisplay('0');
        setEquation('');
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-80 shadow-2xl"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Calculator</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4 text-right">
                    <div className="text-4xl font-bold text-gray-800 dark:text-gray-100">{display}</div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    {['C', 'A', '%', '÷'].map(btn => (
                        <button
                            key={btn}
                            onClick={() => btn === 'C' ? clear() : handleOperator(btn === '÷' ? '/' : btn === 'A' ? '*' : btn)}
                            className="py-4 bg-gray-200 dark:bg-gray-600 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                        >
                            {btn}
                        </button>
                    ))}
                    {['7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+'].map(btn => (
                        <button
                            key={btn}
                            onClick={() => /\d/.test(btn) ? handleNumber(btn) : handleOperator(btn === '×' ? '*' : btn)}
                            className={clsx(
                                "py-4 rounded-lg font-medium transition-colors",
                                /\d/.test(btn)
                                    ? "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
                                    : "bg-purple-500 text-white hover:bg-purple-600"
                            )}
                        >
                            {btn}
                        </button>
                    ))}
                    <button onClick={() => handleNumber('0')} className="col-span-2 py-4 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-200">0</button>
                    <button onClick={() => handleNumber('.')} className="py-4 bg-gray-100 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-200">.</button>
                    <button onClick={calculate} className="py-4 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600">=</button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// --- Dictionary Modal ---
function DictionaryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [word, setWord] = useState('');
    const [definition, setDefinition] = useState<any>(null);

    if (!isOpen) return null;

    const searchWord = async () => {
        // Mock dictionary lookup - in real app, use API
        setDefinition({
            word: word,
            phonetic: '/ˈhæpi/',
            partOfSpeech: 'adjective',
            definition: 'Having a feeling arising from a consciousness of well-being or of enjoyment; enjoying good of any kind, such as comfort, peace, or tranquillity; blissful, contented, or joyous.'
        });
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-96 shadow-2xl"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Dictionary</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={word}
                        onChange={(e) => setWord(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchWord()}
                        placeholder="Enter a word..."
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    />
                    <button
                        onClick={searchWord}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                    >
                        Search
                    </button>
                </div>

                {definition && (
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-purple-600">{definition.word}</h3>
                        <p className="text-purple-500 italic">{definition.phonetic}</p>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{definition.partOfSpeech}</p>
                        <p className="text-gray-700 dark:text-gray-300">{definition.definition}</p>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

// --- AI Draft Modal ---
function AIDraftModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState('General');
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const generateDraft = async () => {
        setIsGenerating(true);
        // Mock AI generation - in real app, use AI API
        setTimeout(() => {
            setIsGenerating(false);
            onClose();
        }, 2000);
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-96 shadow-2xl"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Draft</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prompt</label>
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Email template"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Style</label>
                        <select
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        >
                            <option>General</option>
                            <option>Professional</option>
                            <option>Casual</option>
                            <option>Creative</option>
                        </select>
                    </div>

                    <button
                        onClick={generateDraft}
                        disabled={isGenerating}
                        className="w-full py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                        {isGenerating ? 'Generating...' : 'Generate'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
