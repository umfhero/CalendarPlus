import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap,
    Box,
    GitBranch,
    CheckCircle,
    Cpu,
    Search,
    Trash2,
    MousePointer2,
    Copy,
} from 'lucide-react';
import clsx from 'clsx';

// --- Types ---

type NodeType = 'trigger' | 'action' | 'condition' | 'output' | 'agent' | 'note';

interface NodeData {
    id: string;
    type: NodeType;
    label: string;
    description?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    inputs: string[]; // Node IDs that connect to this
    outputs: string[]; // Node IDs this connects to
    data?: any;
    color?: string; // Custom color override
}

interface EdgeData {
    id: string;
    source: string;
    target: string;
}

interface NodeMapData {
    nodes: NodeData[];
    edges: EdgeData[];
    viewport: { x: number; y: number; zoom: number };
}

interface NodeMapEditorProps {
    contentId: string;
    filePath?: string;
    initialContent?: string;
    onSave?: (content: string) => void;
}

// --- Constants & Presets ---

const NODE_TYPES: Record<NodeType, { label: string; color: string; icon: any; description: string }> = {
    trigger: {
        label: 'Trigger',
        color: 'from-emerald-400 to-emerald-600',
        icon: Zap,
        description: 'Starts a workflow (e.g., On Click, On Time)'
    },
    action: {
        label: 'Action',
        color: 'from-blue-400 to-blue-600',
        icon: Box,
        description: 'Performs a task or operation'
    },
    condition: {
        label: 'Condition',
        color: 'from-amber-400 to-amber-600',
        icon: GitBranch,
        description: 'Splits flow based on logic'
    },
    output: {
        label: 'Output',
        color: 'from-purple-400 to-purple-600',
        icon: CheckCircle,
        description: 'Final result or exit point'
    },
    agent: {
        label: 'Agent',
        color: 'from-rose-400 to-rose-600',
        icon: Cpu,
        description: 'AI Agent or complex subprocess'
    },
    note: {
        label: 'Note',
        color: 'from-gray-400 to-gray-600',
        icon: MousePointer2,
        description: 'Annotation or comment'
    }
};

const INITIAL_DATA: NodeMapData = {
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 }
};

// --- Helper Components ---

const ConnectionLine = ({ start, end }: { start: { x: number; y: number }, end: { x: number; y: number } }) => {
    // Calculate control points for a nice bezier curve
    const deltaX = Math.abs(end.x - start.x);
    const controlPointOffset = Math.max(deltaX * 0.5, 50);

    const path = `M ${start.x} ${start.y} C ${start.x + controlPointOffset} ${start.y}, ${end.x - controlPointOffset} ${end.y}, ${end.x} ${end.y}`;

    return (
        <path
            d={path}
            fill="none"
            stroke="url(#gradient-line)"
            strokeWidth="3"
            strokeLinecap="round"
            className="opacity-60 transition-all duration-300 hover:opacity-100 hover:stroke-[4px]"
        />
    );
};

// --- Main Editor Component ---

export function NodeMapEditor({ contentId, filePath, initialContent, onSave }: NodeMapEditorProps) {
    // State
    const [data, setData] = useState<NodeMapData>(() => {
        if (initialContent) {
            try {
                return JSON.parse(initialContent);
            } catch (e) {
                console.error("Failed to parse initial content", e);
                return INITIAL_DATA;
            }
        }
        return INITIAL_DATA;
    });

    const [isDraggingNode, setIsDraggingNode] = useState<string | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    // Use ref for mouse position to avoid state update lag during drag
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const [connectingNode, setConnectingNode] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // For temporary connection line
    const [potentialTargetNode, setPotentialTargetNode] = useState<string | null>(null);
    const [showAddMenu, setShowAddMenu] = useState<{ x: number, y: number } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string | null } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    // Save functionality
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                save();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [data, onSave]);

    // Close context menu on global click
    useEffect(() => {
        const closeMenu = () => setContextMenu(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    const save = useCallback(async () => {
        const content = JSON.stringify(data, null, 2);

        if (filePath && window.ipcRenderer) {
            // @ts-ignore
            await window.ipcRenderer.invoke('save-workspace-file', {
                filePath,
                content: data
            });
        }

        if (onSave) onSave(content);
    }, [data, filePath, onSave]);

    // Data Loading
    useEffect(() => {
        if (filePath && window.ipcRenderer) {
            const load = async () => {
                // @ts-ignore
                const result = await window.ipcRenderer.invoke('load-workspace-file', filePath);
                if (result) {
                    try {
                        const parsed = typeof result === 'string' ? JSON.parse(result) : result;
                        // Handle wrapped content
                        const content = parsed.content ? (typeof parsed.content === 'string' ? JSON.parse(parsed.content) : parsed.content) : parsed;
                        // Basic validation
                        if (content && Array.isArray(content.nodes)) {
                            setData(content);
                        }
                    } catch (e) {
                        console.error('Error parsing loaded file', e);
                    }
                }
            };
            load();
        }
    }, [filePath, contentId]);

    // -- Event Handlers --

    const handleWheel = (e: React.WheelEvent) => {
        // ... (unchanged)
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSpeed = 0.001;
            const newZoom = Math.min(Math.max(0.1, data.viewport.zoom - e.deltaY * zoomSpeed), 3);
            setData(prev => ({
                ...prev,
                viewport: { ...prev.viewport, zoom: newZoom }
            }));
        } else {
            setData(prev => ({
                ...prev,
                viewport: {
                    ...prev.viewport,
                    x: prev.viewport.x - e.deltaX,
                    y: prev.viewport.y - e.deltaY
                }
            }));
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Middle mouse or Space+Left for panning
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            setIsPanning(true);
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
            e.preventDefault();
        } else if (e.button === 0 && e.target === containerRef.current) {
            // Deselect if clicking on empty space
            setSelectedNodes(new Set());
            setShowAddMenu(null);
            setContextMenu(null);
        } else if (e.button === 2) {
            // Right click on background
            // setContextMenu({ x: e.clientX, y: e.clientY, nodeId: null });
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            // Check if clicked on a node
            // Note: Determining exact node under cursor via data model is hard without hit testing logic
            // But we can capture it in handleNodeMouseDown/ContextMenu bubbling
        }
        // If not handled by node, it's background
        // setContextMenu({ x: e.clientX, y: e.clientY, nodeId: null });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Update global mouse pos for connection line
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const canvasX = (e.clientX - rect.left - data.viewport.x) / data.viewport.zoom;
            const canvasY = (e.clientY - rect.top - data.viewport.y) / data.viewport.zoom;

            // Only update mousePos state if we are actively connecting a node
            // This prevents excessive re-renders during normal mouse movement/panning
            if (connectingNode) {
                setMousePos({ x: canvasX, y: canvasY });
            }

            if (isPanning) {
                const dx = e.clientX - lastMousePosRef.current.x;
                const dy = e.clientY - lastMousePosRef.current.y;
                setData(prev => ({
                    ...prev,
                    viewport: { ...prev.viewport, x: prev.viewport.x + dx, y: prev.viewport.y + dy }
                }));
                lastMousePosRef.current = { x: e.clientX, y: e.clientY };
            }

            if (isDraggingNode) {
                const dx = (e.clientX - lastMousePosRef.current.x) / data.viewport.zoom;
                const dy = (e.clientY - lastMousePosRef.current.y) / data.viewport.zoom;

                setData(prev => ({
                    ...prev,
                    nodes: prev.nodes.map(n =>
                        n.id === isDraggingNode
                            ? { ...n, x: n.x + dx, y: n.y + dy }
                            : n
                    )
                }));
                lastMousePosRef.current = { x: e.clientX, y: e.clientY };
            }

            // Proximity check for connections
            if (connectingNode) {
                let closestId: string | null = null;
                let minDistance = 150; // Threshold in pixels (canvas units)

                data.nodes.forEach(node => {
                    // Skip self
                    if (node.id === connectingNode) return;

                    // Skip if already connected
                    if (data.edges.some(edge =>
                        (edge.source === connectingNode && edge.target === node.id) ||
                        (edge.source === node.id && edge.target === connectingNode)
                    )) return;

                    // Calculate center distance
                    const centerX = node.x + node.width / 2;
                    const centerY = node.y + node.height / 2;
                    const dist = Math.hypot(canvasX - centerX, canvasY - centerY);

                    if (dist < minDistance) {
                        minDistance = dist;
                        closestId = node.id;
                    }
                });

                setPotentialTargetNode(closestId);
            } else if (potentialTargetNode) {
                setPotentialTargetNode(null);
            }
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        setIsPanning(false);
        setIsDraggingNode(null);

        if (connectingNode) {
            // Check if we have a proximity target first (Snap to connect)
            if (potentialTargetNode) {
                addEdge(connectingNode, potentialTargetNode);
                setConnectingNode(null);
                setPotentialTargetNode(null);
                return;
            }

            // If dragging, we might be over the container.
            if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                    const canvasX = (e.clientX - rect.left - data.viewport.x) / data.viewport.zoom;
                    const canvasY = (e.clientY - rect.top - data.viewport.y) / data.viewport.zoom;

                    // Show menu to add node and automatically connect
                    setShowAddMenu({ x: canvasX, y: canvasY });
                    setSearchQuery('');
                    return;
                }
            }
            // If we didn't drop on void, but also didn't complete connection (e.g. dropped on random UI), clear it
            // Unless we dropped on a valid target which is handled by its own handler.
            if (!showAddMenu) {
                setConnectingNode(null);
                setPotentialTargetNode(null);
            }
        }
    };

    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        if (e.button === 0) {
            setIsDraggingNode(nodeId);
            lastMousePosRef.current = { x: e.clientX, y: e.clientY }; // Initialize start pos for drag
            setSelectedNodes(new Set([nodeId]));
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        // Only trigger if clicking on container or SVG (empty space)
        if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
            const rect = containerRef.current!.getBoundingClientRect();
            const x = (e.clientX - rect.left - data.viewport.x) / data.viewport.zoom;
            const y = (e.clientY - rect.top - data.viewport.y) / data.viewport.zoom;
            setShowAddMenu({ x, y });
            setSearchQuery('');
        }
    };

    const addNode = (type: NodeType, pos: { x: number, y: number }) => {
        const newNode: NodeData = {
            id: crypto.randomUUID(),
            type,
            label: `New ${NODE_TYPES[type].label}`,
            x: pos.x - 100, // Center roughly
            y: pos.y - 40,
            width: 200,
            height: 80,
            inputs: [],
            outputs: []
        };

        setData(prev => ({
            ...prev,
            nodes: [...prev.nodes, newNode]
        }));
        setShowAddMenu(null);

        // If we were connecting, create edge
        if (connectingNode) {
            addEdge(connectingNode, newNode.id);
            setConnectingNode(null);
        }
    };

    const addEdge = (sourceId: string, targetId: string) => {
        if (sourceId === targetId) return; // No loops for now

        // Check if edge exists
        if (data.edges.some(e => e.source === sourceId && e.target === targetId)) return;

        const newEdge: EdgeData = {
            id: crypto.randomUUID(),
            source: sourceId,
            target: targetId
        };

        setData(prev => ({
            ...prev,
            edges: [...prev.edges, newEdge]
        }));
    };

    const deleteSelected = () => {
        setData(prev => {
            const newNodes = prev.nodes.filter(n => !selectedNodes.has(n.id));
            const newEdges = prev.edges.filter(e => !selectedNodes.has(e.source) && !selectedNodes.has(e.target));
            return { ...prev, nodes: newNodes, edges: newEdges };
        });
        setSelectedNodes(new Set());
    };

    const startConnection = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        e.preventDefault(); // Prevent accidental text selection
        setConnectingNode(nodeId);
    };

    const handleNodeMouseUp = (e: React.MouseEvent, targetId: string) => {
        e.stopPropagation();

        // Handle connection completion
        if (connectingNode) {
            addEdge(connectingNode, targetId);
            setConnectingNode(null);
            setPotentialTargetNode(null);
        }

        // Always stop dragging when mouse is released on a node
        setIsDraggingNode(null);
    };


    const handleNodeContextMenu = (e: React.MouseEvent, nodeId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            nodeId
        });
    };

    // -- Rendering --

    // Memoized Connection Line
    const MemoizedConnectionLine = useMemo(() => React.memo(ConnectionLine), []);

    // Calculate absolute positions for lines
    const getPortPosition = (nodeId: string, isInput: boolean) => {
        const node = data.nodes.find(n => n.id === nodeId);
        if (!node) return { x: 0, y: 0 };

        if (isInput) {
            return { x: node.x, y: node.y + node.height / 2 };
        } else {
            return { x: node.x + node.width, y: node.y + node.height / 2 };
        }
    };

    const filteredNodeTypes = (Object.entries(NODE_TYPES) as [NodeType, typeof NODE_TYPES[NodeType]][]).filter(([_, val]) =>
        val.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        val.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full w-full relative overflow-hidden bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white selection:bg-blue-500/30">
            {/* Dotted Background Pattern */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)]" />
            {/* SVG Layer for Connections */}
            <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
                <defs>
                    <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                </defs>
                <g style={{ transform: `translate(${data.viewport.x}px, ${data.viewport.y}px) scale(${data.viewport.zoom})` }}>
                    {data.edges.map(edge => {
                        const start = getPortPosition(edge.source, false);
                        const end = getPortPosition(edge.target, true);
                        return <MemoizedConnectionLine key={edge.id} start={start} end={end} />;
                    })}
                    {connectingNode && (
                        <MemoizedConnectionLine
                            start={getPortPosition(connectingNode, false)}
                            end={potentialTargetNode ? getPortPosition(potentialTargetNode, true) : mousePos}
                        />
                    )}
                </g>
            </svg>

            {/* Nodes Layer */}
            <div
                ref={containerRef}
                className="absolute inset-0 w-full h-full z-10 origin-top-left"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleContextMenu}
                style={{
                    cursor: isPanning ? 'grabbing' : 'default',
                    transform: `translate(${data.viewport.x}px, ${data.viewport.y}px) scale(${data.viewport.zoom})`
                }}
            >
                <AnimatePresence>
                    {data.nodes.map(node => {
                        const isSelected = selectedNodes.has(node.id);
                        const isPotentialTarget = potentialTargetNode === node.id;
                        const TypeIcon = NODE_TYPES[node.type].icon;
                        return (
                            <motion.div
                                key={node.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{
                                    scale: isPotentialTarget ? 1.05 : 1,
                                    opacity: 1,
                                    boxShadow: isPotentialTarget
                                        ? "0 0 0 2px #3b82f6, 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                                        : isSelected
                                            ? "0 10px 15px -3px rgba(59, 130, 246, 0.5), 0 4px 6px -2px rgba(59, 130, 246, 0.1)"
                                            : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                                }}
                                exit={{ scale: 0, opacity: 0 }}
                                className={clsx(
                                    "absolute rounded-2xl p-[2px] cursor-pointer transition-shadow",
                                    isSelected || isPotentialTarget ? "z-50" : "z-10"
                                )}
                                style={{
                                    left: node.x,
                                    top: node.y,
                                    width: node.width,
                                    height: node.height,
                                }}
                                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
                                onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
                            >
                                {/* Gradient Border */}
                                <div className={clsx(
                                    "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-80",
                                    NODE_TYPES[node.type].color
                                )} />

                                {/* Inner Content */}
                                <div className="absolute inset-[2px] bg-[#111] rounded-[14px] flex items-center p-3 gap-3 select-none">
                                    <div className={clsx(
                                        "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg",
                                        NODE_TYPES[node.type].color
                                    )}>
                                        <TypeIcon size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <input
                                            value={node.label}
                                            onChange={(e) => {
                                                const newVal = e.target.value;
                                                setData(prev => ({
                                                    ...prev,
                                                    nodes: prev.nodes.map(n => n.id === node.id ? { ...n, label: newVal } : n)
                                                }));
                                            }}
                                            className="bg-transparent text-sm font-semibold text-gray-100 w-full outline-none placeholder-gray-500"
                                            placeholder="Node Name"
                                        />
                                        <div className="text-[10px] text-gray-500 truncate mt-0.5 font-medium tracking-wide uppercase">
                                            {NODE_TYPES[node.type].label}
                                        </div>
                                    </div>

                                    {/* Output connector handle */}
                                    <div
                                        className="w-4 h-4 rounded-full bg-gray-600 hover:bg-blue-400 cursor-crosshair ml-auto -mr-5 border-4 border-[#0a0a0a]"
                                        onMouseDown={(e) => startConnection(e, node.id)}
                                    />
                                </div>

                                {/* Input connector handle (visual only) */}
                                <div className="absolute top-1/2 -left-3 w-4 h-4 rounded-full bg-gray-600 border-4 border-[#0a0a0a] -translate-y-1/2" />

                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Quick Add Menu */}
            <AnimatePresence>
                {showAddMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute z-50 w-72 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                        style={{
                            left: showAddMenu.x * data.viewport.zoom + data.viewport.x,
                            top: showAddMenu.y * data.viewport.zoom + data.viewport.y,
                        }}
                    >
                        <div className="p-3 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                <input
                                    autoFocus
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-black/20 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 outline-none border border-transparent focus:border-white/10 placeholder-gray-500"
                                    placeholder="Search nodes..."
                                />
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                            {filteredNodeTypes.map(([type, config]) => (
                                <button
                                    key={type}
                                    onClick={() => addNode(type as NodeType, showAddMenu)}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group text-left"
                                >
                                    <div className={clsx(
                                        "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br text-white/90 shadow-sm",
                                        config.color
                                    )}>
                                        <config.icon size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-200 group-hover:text-white">
                                            {config.label}
                                        </div>
                                        <div className="text-[10px] text-gray-500 group-hover:text-gray-400">
                                            {config.description}
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {filteredNodeTypes.length === 0 && (
                                <div className="p-4 text-center text-xs text-gray-500">
                                    No nodes found matching "{searchQuery}"
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Context Menu */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute z-[100] w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl p-1.5 overflow-hidden"
                        style={{
                            left: contextMenu.x,
                            top: contextMenu.y,
                        }}
                    >
                        {contextMenu.nodeId ? (
                            <>
                                <button
                                    onClick={() => {
                                        // Duplicate logic (simple clone)
                                        const node = data.nodes.find(n => n.id === contextMenu.nodeId);
                                        if (node) {
                                            addNode(node.type, { x: node.x + 50, y: node.y + 50 });
                                        }
                                        setContextMenu(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-white/10 rounded flex items-center gap-2"
                                >
                                    <Copy size={14} /> Duplicate
                                </button>
                                <button
                                    onClick={() => {
                                        // Delete logic
                                        setData(prev => ({
                                            ...prev,
                                            nodes: prev.nodes.filter(n => n.id !== contextMenu.nodeId),
                                            edges: prev.edges.filter(e => e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId)
                                        }));
                                        setContextMenu(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Add Node
                                </div>
                                {Object.entries(NODE_TYPES).slice(0, 4).map(([type, config]) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            // Add node at cursor relative to viewport
                                            const rect = containerRef.current?.getBoundingClientRect();
                                            if (rect) {
                                                const x = (contextMenu.x - rect.left - data.viewport.x) / data.viewport.zoom;
                                                const y = (contextMenu.y - rect.top - data.viewport.y) / data.viewport.zoom;
                                                addNode(type as NodeType, { x, y: y + 80 }); // offset slightly
                                            }
                                            setContextMenu(null);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-white/10 rounded flex items-center gap-2"
                                    >
                                        <config.icon size={14} className={config.color.replace('from-', 'text-').replace('to-', '')} />
                                        {config.label}
                                    </button>
                                ))}
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Controls */}
            <div className="absolute bottom-6 right-6 flex gap-2">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-full p-1.5 flex gap-1 shadow-lg">
                    <button
                        onClick={() => deleteSelected()}
                        disabled={selectedNodes.size === 0}
                        className="p-2 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Delete Selected"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Top Left Info */}
            <div className="absolute top-6 left-6 pointer-events-none opacity-50">
                <div className="text-xs font-mono text-gray-500">
                    NBM v1.0 • Zoom: {(data.viewport.zoom * 100).toFixed(0)}%
                </div>
            </div>

            {/* Hint Overlay */}
            {data.nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center space-y-2 opacity-30">
                        <MousePointer2 className="w-12 h-12 mx-auto" />
                        <div className="text-sm font-medium">Double-click to add a node</div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NodeMapEditor;
