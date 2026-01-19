/**
 * ConnectionsPanel Component
 * A sidebar panel that shows @ connections for a file.
 * Extends from the right edge of the file tree sidebar.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2Off, Search, ArrowRight, ArrowLeft, FileCode, PenTool, FileText, Plus } from 'lucide-react';
import { WorkspaceFile, FileType, FILE_EXTENSIONS } from '../../types/workspace';
import { parseMentions } from '../../utils/noteLinking';
import { useTheme } from '../../contexts/ThemeContext';
import clsx from 'clsx';

interface ConnectionsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    file: WorkspaceFile | null;
    workspaceFiles: WorkspaceFile[];
    getFileContent: (fileId: string) => Promise<string>;
    onAddConnection: (fromFileId: string, toFileName: string) => Promise<void>;
    onRemoveConnection: (fromFileId: string, mentionText: string) => Promise<void>;
    sidebarWidth?: number;
}

interface Connection {
    fileId: string;
    fileName: string;
    fileType: FileType;
    direction: 'outgoing' | 'incoming';
    mentionText?: string;
}

// Get icon for file type
const getFileIcon = (type: FileType) => {
    switch (type) {
        case 'exec': return FileCode;
        case 'board': return PenTool;
        case 'note': return FileText;
        default: return FileCode;
    }
};

// Get color for file type
const getFileTypeColor = (type: FileType) => {
    switch (type) {
        case 'exec': return '#3b82f6';
        case 'board': return '#a855f7';
        case 'note': return '#22c55e';
        default: return '#6b7280';
    }
};

export function ConnectionsPanel({
    isOpen,
    onClose,
    file,
    workspaceFiles,
    getFileContent,
    onAddConnection,
    onRemoveConnection,
    sidebarWidth = 256,
}: ConnectionsPanelProps) {
    const { accentColor, theme } = useTheme();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [pendingAction, setPendingAction] = useState<string | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        // Delay adding listener to avoid immediate close
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Load connections when panel opens
    useEffect(() => {
        if (!isOpen || !file) return;

        const loadConnections = async () => {
            setIsLoading(true);
            const loadedConnections: Connection[] = [];

            try {
                // Get outgoing connections
                const content = await getFileContent(file.id);
                if (content) {
                    const mentions = parseMentions(content, workspaceFiles);
                    mentions.forEach(mention => {
                        if (mention.linkedFile) {
                            const exists = loadedConnections.some(
                                c => c.fileId === mention.linkedFile!.id && c.direction === 'outgoing'
                            );
                            if (!exists) {
                                loadedConnections.push({
                                    fileId: mention.linkedFile.id,
                                    fileName: mention.linkedFile.name,
                                    fileType: mention.linkedFile.type,
                                    direction: 'outgoing',
                                    mentionText: mention.fullMatch,
                                });
                            }
                        }
                    });
                }

                // Get incoming connections
                for (const otherFile of workspaceFiles) {
                    if (otherFile.id === file.id) continue;

                    const otherContent = await getFileContent(otherFile.id);
                    if (otherContent) {
                        const mentions = parseMentions(otherContent, workspaceFiles);
                        const referencesThisFile = mentions.some(
                            m => m.linkedFile?.id === file.id
                        );
                        if (referencesThisFile) {
                            const exists = loadedConnections.some(
                                c => c.fileId === otherFile.id && c.direction === 'incoming'
                            );
                            if (!exists) {
                                loadedConnections.push({
                                    fileId: otherFile.id,
                                    fileName: otherFile.name,
                                    fileType: otherFile.type,
                                    direction: 'incoming',
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('[ConnectionsPanel] Error loading connections:', e);
            }

            setConnections(loadedConnections);
            setIsLoading(false);
        };

        loadConnections();
    }, [isOpen, file, workspaceFiles, getFileContent]);

    // Reset state when closed
    useEffect(() => {
        if (!isOpen) {
            setShowAddPanel(false);
            setSearchQuery('');
        }
    }, [isOpen]);

    // Filter available files
    const availableFiles = useMemo(() => {
        if (!file) return [];
        const connectedOutgoingIds = new Set(
            connections.filter(c => c.direction === 'outgoing').map(c => c.fileId)
        );

        return workspaceFiles.filter(f => {
            if (f.id === file.id) return false;
            if (connectedOutgoingIds.has(f.id)) return false;
            if (searchQuery) {
                return f.name.toLowerCase().includes(searchQuery.toLowerCase());
            }
            return true;
        });
    }, [workspaceFiles, file, connections, searchQuery]);

    const outgoingConnections = useMemo(() =>
        connections.filter(c => c.direction === 'outgoing'),
        [connections]
    );

    const incomingConnections = useMemo(() =>
        connections.filter(c => c.direction === 'incoming'),
        [connections]
    );

    const handleAddConnection = useCallback(async (targetFile: WorkspaceFile) => {
        if (!file) return;
        setPendingAction(targetFile.id);
        try {
            await onAddConnection(file.id, targetFile.name);
            setConnections(prev => [
                ...prev,
                {
                    fileId: targetFile.id,
                    fileName: targetFile.name,
                    fileType: targetFile.type,
                    direction: 'outgoing',
                    mentionText: targetFile.name.includes(' ')
                        ? `@"${targetFile.name}"`
                        : `@${targetFile.name}`,
                }
            ]);
            setShowAddPanel(false);
            setSearchQuery('');
        } catch (e) {
            console.error('[ConnectionsPanel] Error adding connection:', e);
        }
        setPendingAction(null);
    }, [file, onAddConnection]);

    const handleRemoveConnection = useCallback(async (connection: Connection) => {
        if (!file || connection.direction !== 'outgoing' || !connection.mentionText) return;

        setPendingAction(connection.fileId);
        try {
            await onRemoveConnection(file.id, connection.mentionText);
            setConnections(prev =>
                prev.filter(c => !(c.fileId === connection.fileId && c.direction === 'outgoing'))
            );
        } catch (e) {
            console.error('[ConnectionsPanel] Error removing connection:', e);
        }
        setPendingAction(null);
    }, [file, onRemoveConnection]);

    if (!file) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={panelRef}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    className={clsx(
                        'fixed top-0 bottom-0 z-[100] w-[320px] flex flex-col',
                        'shadow-xl border-r',
                        theme === 'dark'
                            ? 'bg-gray-900 border-gray-700'
                            : 'bg-white border-gray-200'
                    )}
                    style={{ left: sidebarWidth }}
                >
                    {/* Header */}
                    <div className={clsx(
                        'flex items-center justify-between px-4 py-3 border-b shrink-0',
                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    )}>
                        <div className="flex-1 min-w-0">
                            <h2 className={clsx(
                                'text-sm font-semibold truncate',
                                theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                            )}>
                                @ Connections
                            </h2>
                            <p className={clsx(
                                'text-xs truncate',
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            )}>
                                {file.name}{FILE_EXTENSIONS[file.type]}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className={clsx(
                                'p-1.5 rounded-md transition-colors shrink-0',
                                theme === 'dark'
                                    ? 'hover:bg-gray-800 text-gray-400'
                                    : 'hover:bg-gray-100 text-gray-500'
                            )}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div
                                    className="w-6 h-6 border-2 rounded-full animate-spin"
                                    style={{
                                        borderColor: `${accentColor}30`,
                                        borderTopColor: accentColor
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* Outgoing Connections */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <ArrowRight className={clsx(
                                                'w-3.5 h-3.5',
                                                theme === 'dark' ? 'text-blue-400' : 'text-blue-500'
                                            )} />
                                            <span className={clsx(
                                                'text-xs font-medium',
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                            )}>
                                                Connects to ({outgoingConnections.length})
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setShowAddPanel(!showAddPanel)}
                                            className={clsx(
                                                'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                                                showAddPanel
                                                    ? theme === 'dark'
                                                        ? 'text-gray-400'
                                                        : 'text-gray-600'
                                                    : theme === 'dark'
                                                        ? 'text-blue-400 hover:text-blue-300'
                                                        : 'text-blue-600 hover:text-blue-700'
                                            )}
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Add
                                        </button>
                                    </div>

                                    {/* Add Panel */}
                                    <AnimatePresence>
                                        {showAddPanel && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className={clsx(
                                                    'mb-3 rounded-lg border overflow-hidden',
                                                    theme === 'dark'
                                                        ? 'border-gray-700'
                                                        : 'border-gray-200'
                                                )}
                                            >
                                                <div className={clsx(
                                                    'flex items-center gap-2 px-2.5 py-2 border-b',
                                                    theme === 'dark'
                                                        ? 'bg-gray-800/50 border-gray-700'
                                                        : 'bg-gray-50 border-gray-200'
                                                )}>
                                                    <Search className={clsx(
                                                        'w-3.5 h-3.5',
                                                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                    )} />
                                                    <input
                                                        type="text"
                                                        placeholder="Search files..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className={clsx(
                                                            'flex-1 bg-transparent text-xs outline-none',
                                                            theme === 'dark'
                                                                ? 'text-gray-200 placeholder:text-gray-500'
                                                                : 'text-gray-800 placeholder:text-gray-400'
                                                        )}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-32 overflow-y-auto custom-scrollbar">
                                                    {availableFiles.length === 0 ? (
                                                        <p className={clsx(
                                                            'px-3 py-2 text-xs text-center',
                                                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                                                        )}>
                                                            {searchQuery
                                                                ? 'No matching files'
                                                                : 'No more files'}
                                                        </p>
                                                    ) : (
                                                        availableFiles.slice(0, 10).map(f => {
                                                            const Icon = getFileIcon(f.type);
                                                            const color = getFileTypeColor(f.type);
                                                            const isAdding = pendingAction === f.id;

                                                            return (
                                                                <button
                                                                    key={f.id}
                                                                    onClick={() => handleAddConnection(f)}
                                                                    disabled={isAdding}
                                                                    className={clsx(
                                                                        'w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors',
                                                                        theme === 'dark'
                                                                            ? 'hover:bg-gray-800'
                                                                            : 'hover:bg-gray-50',
                                                                        isAdding && 'opacity-50'
                                                                    )}
                                                                >
                                                                    <Icon
                                                                        className="w-3.5 h-3.5 shrink-0"
                                                                        style={{ color }}
                                                                    />
                                                                    <span className={clsx(
                                                                        'flex-1 text-left truncate',
                                                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                                    )}>
                                                                        {f.name}
                                                                    </span>
                                                                    {isAdding && (
                                                                        <div
                                                                            className="w-3 h-3 border rounded-full animate-spin shrink-0"
                                                                            style={{
                                                                                borderColor: `${accentColor}30`,
                                                                                borderTopColor: accentColor
                                                                            }}
                                                                        />
                                                                    )}
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Outgoing List */}
                                    {outgoingConnections.length === 0 ? (
                                        <p className={clsx(
                                            'text-xs py-3 text-center',
                                            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                        )}>
                                            No outgoing connections
                                        </p>
                                    ) : (
                                        <div className="space-y-1">
                                            {outgoingConnections.map(conn => {
                                                const Icon = getFileIcon(conn.fileType);
                                                const color = getFileTypeColor(conn.fileType);
                                                const isRemoving = pendingAction === conn.fileId;

                                                return (
                                                    <div
                                                        key={conn.fileId}
                                                        className={clsx(
                                                            'flex items-center gap-2 px-2.5 py-2 rounded-lg group',
                                                            theme === 'dark'
                                                                ? 'hover:bg-gray-800/50'
                                                                : 'hover:bg-gray-50'
                                                        )}
                                                    >
                                                        <Icon
                                                            className="w-3.5 h-3.5 shrink-0"
                                                            style={{ color }}
                                                        />
                                                        <span className={clsx(
                                                            'flex-1 text-xs truncate',
                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                        )}>
                                                            {conn.fileName}
                                                        </span>
                                                        <button
                                                            onClick={() => handleRemoveConnection(conn)}
                                                            disabled={isRemoving}
                                                            className={clsx(
                                                                'p-1 rounded opacity-0 group-hover:opacity-100 transition-all',
                                                                theme === 'dark'
                                                                    ? 'hover:bg-red-500/20 text-red-400'
                                                                    : 'hover:bg-red-50 text-red-500',
                                                                isRemoving && 'opacity-50'
                                                            )}
                                                            title="Remove"
                                                        >
                                                            {isRemoving ? (
                                                                <div
                                                                    className="w-3 h-3 border rounded-full animate-spin"
                                                                    style={{
                                                                        borderColor: '#f8717130',
                                                                        borderTopColor: '#f87171'
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Link2Off className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className={clsx(
                                    'h-px',
                                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                                )} />

                                {/* Incoming Connections */}
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <ArrowLeft className={clsx(
                                            'w-3.5 h-3.5',
                                            theme === 'dark' ? 'text-green-400' : 'text-green-500'
                                        )} />
                                        <span className={clsx(
                                            'text-xs font-medium',
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                        )}>
                                            Connected from ({incomingConnections.length})
                                        </span>
                                    </div>

                                    {incomingConnections.length === 0 ? (
                                        <p className={clsx(
                                            'text-xs py-3 text-center',
                                            theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                                        )}>
                                            No incoming connections
                                        </p>
                                    ) : (
                                        <div className="space-y-1">
                                            {incomingConnections.map(conn => {
                                                const Icon = getFileIcon(conn.fileType);
                                                const color = getFileTypeColor(conn.fileType);

                                                return (
                                                    <div
                                                        key={conn.fileId}
                                                        className={clsx(
                                                            'flex items-center gap-2 px-2.5 py-2 rounded-lg',
                                                            theme === 'dark'
                                                                ? 'hover:bg-gray-800/50'
                                                                : 'hover:bg-gray-50'
                                                        )}
                                                    >
                                                        <Icon
                                                            className="w-3.5 h-3.5 shrink-0"
                                                            style={{ color }}
                                                        />
                                                        <span className={clsx(
                                                            'flex-1 text-xs truncate',
                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                                        )}>
                                                            {conn.fileName}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default ConnectionsPanel;
