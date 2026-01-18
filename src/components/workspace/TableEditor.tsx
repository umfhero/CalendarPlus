import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Check, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ClipboardPaste, Palette, ChevronDown, Undo2, Redo2, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface TableEditorProps {
    isOpen: boolean;
    onClose: () => void;
    initialMarkdown: string;
    onSave: (markdown: string) => void;
}

interface TableData {
    headers: string[];
    rows: string[][];
}

interface TableTheme {
    highlightHeader: boolean;
    highlightFirstColumn: boolean;
    alternateRows: boolean;
    numberedFirstColumn: boolean;
    themeColor: string; // hex color for highlights
}

// Parse markdown table to structured data
function parseMarkdownTable(markdown: string): { data: TableData; theme: TableTheme } | null {
    // Check for theme metadata - find the LAST occurrence
    let theme: TableTheme = {
        highlightHeader: true,
        highlightFirstColumn: false,
        alternateRows: false,
        numberedFirstColumn: false,
        themeColor: '#9CA3AF', // Default gray
    };

    // Find all theme comments and use the last one
    const themeMatches = markdown.match(/<!-- table-theme: (.+?) -->/g);
    if (themeMatches && themeMatches.length > 0) {
        const lastMatch = themeMatches[themeMatches.length - 1];
        const themeData = lastMatch.match(/<!-- table-theme: (.+?) -->/);
        if (themeData) {
            try {
                theme = JSON.parse(themeData[1]);
            } catch (e) {
                console.error('Failed to parse theme:', e);
            }
        }
    }

    // Remove ALL theme comments from markdown
    markdown = markdown.replace(/<!-- table-theme: .+? -->\n?/g, '');

    const lines = markdown.trim().split('\n').filter(line => line.trim());
    if (lines.length < 2) return null;

    const headerLine = lines[0];
    const separatorLine = lines[1];

    // Check if it's a valid table (has separator with dashes)
    if (!separatorLine.includes('-')) return null;

    const headers = headerLine.split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0);

    const rows: string[][] = [];
    for (let i = 2; i < lines.length; i++) {
        const cells = lines[i].split('|')
            .map(cell => cell.trim())
            .filter(cell => cell.length > 0);
        if (cells.length > 0) {
            // Ensure row has same number of cells as headers
            while (cells.length < headers.length) cells.push('');
            rows.push(cells.slice(0, headers.length));
        }
    }

    return { data: { headers, rows }, theme };
}

// Convert structured data back to markdown table with theme styling
function toMarkdownTable(data: TableData, theme: TableTheme): string {
    const { headers, rows } = data;
    if (headers.length === 0) return '';

    // Header row
    const headerRow = '| ' + headers.join(' | ') + ' |';

    // Separator row with alignment hints based on theme
    const separator = '| ' + headers.map(() => '--------').join(' | ') + ' |';

    // Data rows
    const dataRows = rows.map(row => {
        // Ensure row has same length as headers
        const paddedRow = [...row];
        while (paddedRow.length < headers.length) paddedRow.push('');
        return '| ' + paddedRow.slice(0, headers.length).join(' | ') + ' |';
    });

    let markdown = [headerRow, separator, ...dataRows].join('\n');

    // Add HTML comment with theme metadata so it can be restored (only one comment)
    if (theme.highlightHeader || theme.highlightFirstColumn || theme.alternateRows || theme.numberedFirstColumn) {
        const themeData = JSON.stringify(theme);
        markdown = `<!-- table-theme: ${themeData} -->\n${markdown}`;
    }

    return markdown;
}

// Parse pasted content (Excel/Google Sheets format: tab-separated)
function parsePastedContent(text: string): TableData | null {
    const lines = text.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return null;

    // Detect delimiter (tab for Excel/Sheets, comma for CSV)
    const delimiter = lines[0].includes('\t') ? '\t' : ',';

    const allRows = lines.map(line =>
        line.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ''))
    );

    if (allRows.length === 0 || allRows[0].length === 0) return null;

    // First row as headers
    const headers = allRows[0];
    const rows = allRows.slice(1);

    return { headers, rows };
}

export function TableEditor({ isOpen, onClose, initialMarkdown, onSave }: TableEditorProps) {
    const { accentColor } = useTheme();
    const [tableData, setTableData] = useState<TableData>({ headers: ['Column 1', 'Column 2', 'Column 3'], rows: [['', '', '']] });
    const [tableTheme, setTableTheme] = useState<TableTheme>({
        highlightHeader: true,
        highlightFirstColumn: false,
        alternateRows: false,
        numberedFirstColumn: false,
        themeColor: '#9CA3AF', // Default gray
    });
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const [showPresetsMenu, setShowPresetsMenu] = useState(false);
    const [history, setHistory] = useState<{ data: TableData; theme: TableTheme }[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    const themeMenuRef = useRef<HTMLDivElement>(null);
    const presetsMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && initialMarkdown) {
            const parsed = parseMarkdownTable(initialMarkdown);
            if (parsed) {
                // Check if theme color needs to be updated to current accent color
                // This handles the case where user had accent color selected, changed global accent, then reopened
                let updatedTheme = parsed.theme;

                // If the saved color is not one of our fixed presets, assume it was an accent color
                const fixedColors = ['#9CA3AF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
                if (!fixedColors.includes(parsed.theme.themeColor)) {
                    // It was likely an accent color, update to current accent
                    updatedTheme = { ...parsed.theme, themeColor: accentColor };
                }

                setTableData(parsed.data);
                setTableTheme(updatedTheme);
                setHistory([{ data: parsed.data, theme: updatedTheme }]);
                setHistoryIndex(0);
            } else {
                // Try parsing as pasted content
                const pasted = parsePastedContent(initialMarkdown);
                if (pasted) {
                    setTableData(pasted);
                    setHistory([{ data: pasted, theme: tableTheme }]);
                    setHistoryIndex(0);
                }
            }
        }
    }, [isOpen, initialMarkdown, accentColor]);

    // Close theme menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
                setShowThemeMenu(false);
            }
            if (presetsMenuRef.current && !presetsMenuRef.current.contains(e.target as Node)) {
                setShowPresetsMenu(false);
            }
        };
        if (showThemeMenu || showPresetsMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showThemeMenu, showPresetsMenu]);

    // Save to history
    const saveToHistory = useCallback((data: TableData, theme: TableTheme) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push({ data, theme });
            return newHistory.slice(-50); // Keep last 50 states
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, [historyIndex]);

    // Undo
    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setTableData(history[newIndex].data);
            setTableTheme(history[newIndex].theme);
        }
    }, [historyIndex, history]);

    // Redo
    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setTableData(history[newIndex].data);
            setTableTheme(history[newIndex].theme);
        }
    }, [historyIndex, history]);

    // Update numbered column when rows change
    useEffect(() => {
        if (tableTheme.numberedFirstColumn && tableData.rows.length > 0) {
            setTableData(prev => ({
                ...prev,
                rows: prev.rows.map((row, idx) => {
                    const newRow = [...row];
                    newRow[0] = String(idx + 1);
                    return newRow;
                })
            }));
        }
    }, [tableData.rows.length, tableTheme.numberedFirstColumn]);

    // Handle paste from clipboard button
    const handlePasteFromClipboard = async () => {
        try {
            const clipboardItems = await navigator.clipboard.read();
            for (const item of clipboardItems) {
                // Try HTML first
                if (item.types.includes('text/html')) {
                    const blob = await item.getType('text/html');
                    const html = await blob.text();

                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const table = doc.querySelector('table');

                    if (table) {
                        const rows = Array.from(table.querySelectorAll('tr'));
                        const allRows: string[][] = [];

                        rows.forEach((row) => {
                            const cells = Array.from(row.querySelectorAll('td, th'));
                            const cellTexts = cells.map(cell => {
                                const text = cell.textContent?.trim() || '';
                                return text.replace(/\s+/g, ' ');
                            });
                            if (cellTexts.length > 0) {
                                allRows.push(cellTexts);
                            }
                        });

                        if (allRows.length > 0) {
                            const headers = allRows[0];
                            const dataRows = allRows.slice(1);
                            setTableData({ headers, rows: dataRows.length > 0 ? dataRows : [new Array(headers.length).fill('')] });
                            return;
                        }
                    }
                }

                // Fall back to plain text
                if (item.types.includes('text/plain')) {
                    const blob = await item.getType('text/plain');
                    const text = await blob.text();
                    const parsed = parsePastedContent(text);
                    if (parsed && parsed.headers.length > 1) {
                        setTableData(parsed);
                        return;
                    }
                }
            }
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
    };

    // Handle paste event anywhere in the modal
    const handlePaste = useCallback((e: ClipboardEvent) => {
        // Try HTML first (Excel/Word tables)
        const html = e.clipboardData?.getData('text/html');
        if (html) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const table = doc.querySelector('table');

                if (table) {
                    e.preventDefault();

                    const rows = Array.from(table.querySelectorAll('tr'));
                    const allRows: string[][] = [];

                    rows.forEach((row) => {
                        const cells = Array.from(row.querySelectorAll('td, th'));
                        const cellTexts = cells.map(cell => {
                            // Get full text content and clean it up
                            const text = cell.textContent?.trim() || '';
                            // Remove extra whitespace but preserve content
                            return text.replace(/\s+/g, ' ');
                        });
                        if (cellTexts.length > 0) {
                            allRows.push(cellTexts);
                        }
                    });

                    if (allRows.length > 0) {
                        const headers = allRows[0];
                        const dataRows = allRows.slice(1);
                        setTableData({ headers, rows: dataRows.length > 0 ? dataRows : [new Array(headers.length).fill('')] });
                        return;
                    }
                }
            } catch (err) {
                console.error('Error parsing HTML table:', err);
            }
        }

        // Fall back to plain text (tab/comma separated)
        const text = e.clipboardData?.getData('text');
        if (!text) return;

        const parsed = parsePastedContent(text);
        if (parsed && parsed.headers.length > 1) {
            e.preventDefault();
            setTableData(parsed);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('paste', handlePaste);
            return () => document.removeEventListener('paste', handlePaste);
        }
    }, [isOpen, handlePaste]);

    const updateHeader = (index: number, value: string) => {
        const newData = {
            ...tableData,
            headers: tableData.headers.map((h, i) => i === index ? value : h)
        };
        setTableData(newData);
        saveToHistory(newData, tableTheme);
    };

    const updateCell = (rowIndex: number, colIndex: number, value: string) => {
        const newData = {
            ...tableData,
            rows: tableData.rows.map((row, ri) =>
                ri === rowIndex
                    ? row.map((cell, ci) => ci === colIndex ? value : cell)
                    : row
            )
        };
        setTableData(newData);
        saveToHistory(newData, tableTheme);
    };

    const addColumn = () => {
        const newData = {
            headers: [...tableData.headers, `Column ${tableData.headers.length + 1}`],
            rows: tableData.rows.map(row => [...row, ''])
        };
        setTableData(newData);
        saveToHistory(newData, tableTheme);
    };

    const removeColumn = (index: number) => {
        if (tableData.headers.length <= 1) return;
        const newData = {
            headers: tableData.headers.filter((_, i) => i !== index),
            rows: tableData.rows.map(row => row.filter((_, i) => i !== index))
        };
        setTableData(newData);
        saveToHistory(newData, tableTheme);
    };

    const addRow = () => {
        const newRow = new Array(tableData.headers.length).fill('');
        // If numbered column is enabled, set the number
        if (tableTheme.numberedFirstColumn) {
            newRow[0] = String(tableData.rows.length + 1);
        }
        const newData = {
            ...tableData,
            rows: [...tableData.rows, newRow]
        };
        setTableData(newData);
        saveToHistory(newData, tableTheme);
    };

    const removeRow = (index: number) => {
        if (tableData.rows.length <= 1) return;
        const newData = {
            ...tableData,
            rows: tableData.rows.filter((_, i) => i !== index)
        };
        setTableData(newData);
        saveToHistory(newData, tableTheme);
    };

    const moveRow = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= tableData.rows.length) return;

        const newRows = [...tableData.rows];
        [newRows[index], newRows[newIndex]] = [newRows[newIndex], newRows[index]];
        const newData = { ...tableData, rows: newRows };
        setTableData(newData);
        saveToHistory(newData, tableTheme);
    };

    const moveColumn = (index: number, direction: 'left' | 'right') => {
        const newIndex = direction === 'left' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= tableData.headers.length) return;

        const newHeaders = [...tableData.headers];
        [newHeaders[index], newHeaders[newIndex]] = [newHeaders[newIndex], newHeaders[index]];

        const newRows = tableData.rows.map(row => {
            const newRow = [...row];
            [newRow[index], newRow[newIndex]] = [newRow[newIndex], newRow[index]];
            return newRow;
        });

        const newData = { headers: newHeaders, rows: newRows };
        setTableData(newData);
        saveToHistory(newData, tableTheme);
    };

    const handleSave = () => {
        const markdown = toMarkdownTable(tableData, tableTheme);
        onSave(markdown);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number, isHeader: boolean) => {
        if (e.key === 'Tab') {
            e.preventDefault();

            if (e.shiftKey) {
                // Shift+Tab - move backwards
                if (colIndex > 0) {
                    // Move to previous column in same row
                    const key = isHeader ? `header-${colIndex - 1}` : `cell-${rowIndex}-${colIndex - 1}`;
                    inputRefs.current[key]?.focus();
                } else if (!isHeader && rowIndex > 0) {
                    // Move to last column of previous row
                    const key = `cell-${rowIndex - 1}-${tableData.headers.length - 1}`;
                    inputRefs.current[key]?.focus();
                } else if (!isHeader && rowIndex === 0) {
                    // Move to last header
                    inputRefs.current[`header-${tableData.headers.length - 1}`]?.focus();
                }
            } else {
                // Tab - move forwards
                if (colIndex < tableData.headers.length - 1) {
                    // Move to next column in same row
                    const key = isHeader ? `header-${colIndex + 1}` : `cell-${rowIndex}-${colIndex + 1}`;
                    inputRefs.current[key]?.focus();
                } else if (isHeader) {
                    // Move from last header to first cell of first row
                    inputRefs.current[`cell-0-0`]?.focus();
                } else if (rowIndex < tableData.rows.length - 1) {
                    // Move to first column of next row
                    inputRefs.current[`cell-${rowIndex + 1}-0`]?.focus();
                }
            }
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isHeader && rowIndex < tableData.rows.length - 1) {
                inputRefs.current[`cell-${rowIndex + 1}-${colIndex}`]?.focus();
            } else if (!isHeader && rowIndex === tableData.rows.length - 1) {
                addRow();
                setTimeout(() => {
                    inputRefs.current[`cell-${rowIndex + 1}-${colIndex}`]?.focus();
                }, 50);
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Table</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Paste from Excel/Sheets or edit cells directly
                                </p>
                            </div>
                            <div className="flex items-center gap-2 relative">
                                {/* Undo/Redo */}
                                <button
                                    onClick={handleUndo}
                                    disabled={historyIndex <= 0}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Undo"
                                >
                                    <Undo2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleRedo}
                                    disabled={historyIndex >= history.length - 1}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Redo"
                                >
                                    <Redo2 className="w-4 h-4" />
                                </button>

                                <div className="w-px h-6 bg-gray-200 dark:border-gray-700"></div>

                                {/* Theme Options */}
                                <div ref={themeMenuRef} className="relative">
                                    <button
                                        onClick={() => setShowThemeMenu(!showThemeMenu)}
                                        className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                                    >
                                        <Palette className="w-4 h-4" />
                                        <span className="text-sm font-medium">Theme</span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${showThemeMenu ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {showThemeMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50"
                                            >
                                                <div className="space-y-2">
                                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                                        Table Style
                                                    </div>

                                                    <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={tableTheme.highlightHeader}
                                                            onChange={(e) => {
                                                                const newTheme = { ...tableTheme, highlightHeader: e.target.checked };
                                                                setTableTheme(newTheme);
                                                                saveToHistory(tableData, newTheme);
                                                            }}
                                                            className="w-4 h-4 rounded"
                                                            style={{ accentColor }}
                                                        />
                                                        <span className="text-sm">Highlight Header Row</span>
                                                    </label>

                                                    <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={tableTheme.highlightFirstColumn}
                                                            onChange={(e) => {
                                                                const newTheme = { ...tableTheme, highlightFirstColumn: e.target.checked };
                                                                setTableTheme(newTheme);
                                                                saveToHistory(tableData, newTheme);
                                                            }}
                                                            className="w-4 h-4 rounded"
                                                            style={{ accentColor }}
                                                        />
                                                        <span className="text-sm">Highlight First Column</span>
                                                    </label>

                                                    <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={tableTheme.alternateRows}
                                                            onChange={(e) => {
                                                                const newTheme = { ...tableTheme, alternateRows: e.target.checked };
                                                                setTableTheme(newTheme);
                                                                saveToHistory(tableData, newTheme);
                                                            }}
                                                            className="w-4 h-4 rounded"
                                                            style={{ accentColor }}
                                                        />
                                                        <span className="text-sm">Alternate Row Colors</span>
                                                    </label>

                                                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                                        Highlight Color
                                                    </div>

                                                    <div className="grid grid-cols-4 gap-2 p-2">
                                                        {[
                                                            { name: 'Gray', color: '#9CA3AF' },
                                                            { name: 'Accent', color: accentColor },
                                                            { name: 'Blue', color: '#3B82F6' },
                                                            { name: 'Green', color: '#10B981' },
                                                            { name: 'Yellow', color: '#F59E0B' },
                                                            { name: 'Red', color: '#EF4444' },
                                                            { name: 'Purple', color: '#8B5CF6' },
                                                            { name: 'Pink', color: '#EC4899' },
                                                        ].map((colorOption) => (
                                                            <button
                                                                key={colorOption.name}
                                                                onClick={() => {
                                                                    const newTheme = { ...tableTheme, themeColor: colorOption.color };
                                                                    setTableTheme(newTheme);
                                                                    saveToHistory(tableData, newTheme);
                                                                }}
                                                                className="relative w-full aspect-square rounded-lg border-2 transition-all hover:scale-110"
                                                                style={{
                                                                    backgroundColor: colorOption.color,
                                                                    borderColor: tableTheme.themeColor === colorOption.color ? '#000' : 'transparent'
                                                                }}
                                                                title={colorOption.name}
                                                            >
                                                                {tableTheme.themeColor === colorOption.color && (
                                                                    <Check className="w-4 h-4 absolute inset-0 m-auto text-white drop-shadow-lg" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Presets Menu */}
                                <div ref={presetsMenuRef} className="relative">
                                    <button
                                        onClick={() => setShowPresetsMenu(!showPresetsMenu)}
                                        className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span className="text-sm font-medium">Presets</span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${showPresetsMenu ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {showPresetsMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50"
                                            >
                                                <div className="space-y-2">
                                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                                        Quick Presets
                                                    </div>

                                                    <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={tableTheme.numberedFirstColumn}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                const newTheme = { ...tableTheme, numberedFirstColumn: checked };
                                                                setTableTheme(newTheme);
                                                                if (checked) {
                                                                    // Auto-number first column
                                                                    const newData = {
                                                                        ...tableData,
                                                                        headers: ['#', ...tableData.headers.slice(1)],
                                                                        rows: tableData.rows.map((row, idx) => {
                                                                            const newRow = [...row];
                                                                            newRow[0] = String(idx + 1);
                                                                            return newRow;
                                                                        })
                                                                    };
                                                                    setTableData(newData);
                                                                    saveToHistory(newData, newTheme);
                                                                } else {
                                                                    saveToHistory(tableData, newTheme);
                                                                }
                                                            }}
                                                            className="w-4 h-4 rounded"
                                                            style={{ accentColor }}
                                                        />
                                                        <span className="text-sm">Auto-Number Rows</span>
                                                    </label>

                                                    <button
                                                        onClick={() => {
                                                            const newData = {
                                                                ...tableData,
                                                                headers: ['Task', 'Status', 'Priority'],
                                                                rows: [['', 'To Do', 'Medium']]
                                                            };
                                                            setTableData(newData);
                                                            const newTheme = { ...tableTheme, highlightHeader: true };
                                                            setTableTheme(newTheme);
                                                            saveToHistory(newData, newTheme);
                                                            setShowPresetsMenu(false);
                                                        }}
                                                        className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                    >
                                                        <div className="text-sm font-medium">Task List</div>
                                                        <div className="text-xs text-gray-500">Task, Status, Priority columns</div>
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            const newData = {
                                                                ...tableData,
                                                                headers: ['Date', 'Event', 'Notes'],
                                                                rows: [['', '', '']]
                                                            };
                                                            setTableData(newData);
                                                            const newTheme = { ...tableTheme, highlightHeader: true, alternateRows: true };
                                                            setTableTheme(newTheme);
                                                            saveToHistory(newData, newTheme);
                                                            setShowPresetsMenu(false);
                                                        }}
                                                        className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                    >
                                                        <div className="text-sm font-medium">Timeline</div>
                                                        <div className="text-xs text-gray-500">Date, Event, Notes columns</div>
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            const newData = {
                                                                ...tableData,
                                                                headers: ['Feature', 'Description', 'Status'],
                                                                rows: [['', '', '']]
                                                            };
                                                            setTableData(newData);
                                                            const newTheme = { ...tableTheme, highlightHeader: true, highlightFirstColumn: true };
                                                            setTableTheme(newTheme);
                                                            saveToHistory(newData, newTheme);
                                                            setShowPresetsMenu(false);
                                                        }}
                                                        className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                    >
                                                        <div className="text-sm font-medium">Feature Matrix</div>
                                                        <div className="text-xs text-gray-500">Feature, Description, Status</div>
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            const newData = {
                                                                ...tableData,
                                                                headers: ['Name', 'Email', 'Phone', 'Role'],
                                                                rows: [['', '', '', '']]
                                                            };
                                                            setTableData(newData);
                                                            const newTheme = { ...tableTheme, highlightHeader: true, alternateRows: true };
                                                            setTableTheme(newTheme);
                                                            saveToHistory(newData, newTheme);
                                                            setShowPresetsMenu(false);
                                                        }}
                                                        className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                    >
                                                        <div className="text-sm font-medium">Contact List</div>
                                                        <div className="text-xs text-gray-500">Name, Email, Phone, Role</div>
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Table Editor */}
                        <div className="p-4 overflow-auto max-h-[60vh] scrollbar-thin">
                            <style>{`
                                .scrollbar-thin::-webkit-scrollbar {
                                    width: 8px;
                                    height: 8px;
                                }
                                .scrollbar-thin::-webkit-scrollbar-track {
                                    background: transparent;
                                }
                                .scrollbar-thin::-webkit-scrollbar-thumb {
                                    background: ${accentColor}40;
                                    border-radius: 4px;
                                }
                                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                                    background: ${accentColor}60;
                                }
                            `}</style>
                            <div className="min-w-max">
                                <table className="w-full border-collapse">
                                    {/* Column Controls */}
                                    <thead>
                                        <tr>
                                            <th className="w-10"></th>
                                            {tableData.headers.map((_, colIndex) => (
                                                <th key={colIndex} className="px-1 pb-2">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => moveColumn(colIndex, 'left')}
                                                            disabled={colIndex === 0}
                                                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
                                                        >
                                                            <ArrowLeft className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => removeColumn(colIndex)}
                                                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                                                            title="Remove column"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => moveColumn(colIndex, 'right')}
                                                            disabled={colIndex === tableData.headers.length - 1}
                                                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
                                                        >
                                                            <ArrowRight className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="w-10">
                                                <button
                                                    onClick={addColumn}
                                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    title="Add column"
                                                >
                                                    <Plus className="w-4 h-4 text-gray-500" />
                                                </button>
                                            </th>
                                        </tr>
                                        {/* Headers */}
                                        <tr>
                                            <th className="w-10"></th>
                                            {tableData.headers.map((header, colIndex) => (
                                                <th key={colIndex} className="p-1">
                                                    <input
                                                        ref={el => inputRefs.current[`header-${colIndex}`] = el}
                                                        type="text"
                                                        value={header}
                                                        onChange={(e) => updateHeader(colIndex, e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, -1, colIndex, true)}
                                                        className="w-full px-3 py-2 rounded-lg border-2 font-semibold text-center outline-none transition-all"
                                                        style={{
                                                            backgroundColor: tableTheme.highlightHeader ? `${tableTheme.themeColor}30` : 'transparent',
                                                            borderColor: 'transparent',
                                                            color: 'inherit'
                                                        }}
                                                        onFocus={(e) => e.target.style.borderColor = accentColor}
                                                        onBlur={(e) => e.target.style.borderColor = 'transparent'}
                                                        placeholder={`Header ${colIndex + 1}`}
                                                        disabled={tableTheme.numberedFirstColumn && colIndex === 0}
                                                    />
                                                </th>
                                            ))}
                                            <th className="w-10"></th>
                                        </tr>
                                    </thead>
                                    {/* Body */}
                                    <tbody>
                                        {tableData.rows.map((row, rowIndex) => (
                                            <tr key={rowIndex} className="group">
                                                <td className="w-10 pr-2">
                                                    <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => moveRow(rowIndex, 'up')}
                                                            disabled={rowIndex === 0}
                                                            className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
                                                        >
                                                            <ArrowUp className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => removeRow(rowIndex)}
                                                            className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                                                            title="Remove row"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => moveRow(rowIndex, 'down')}
                                                            disabled={rowIndex === tableData.rows.length - 1}
                                                            className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"
                                                        >
                                                            <ArrowDown className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </td>
                                                {row.map((cell, colIndex) => (
                                                    <td key={colIndex} className="p-1">
                                                        <input
                                                            ref={el => inputRefs.current[`cell-${rowIndex}-${colIndex}`] = el}
                                                            type="text"
                                                            value={cell}
                                                            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                                            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex, false)}
                                                            className="w-full px-3 py-2 rounded-lg border-2 outline-none transition-all"
                                                            style={{
                                                                backgroundColor:
                                                                    (tableTheme.highlightFirstColumn && colIndex === 0) ? `${tableTheme.themeColor}20` :
                                                                        (tableTheme.alternateRows && rowIndex % 2 === 1) ? `${tableTheme.themeColor}10` :
                                                                            'transparent',
                                                                borderColor: 'transparent',
                                                                fontWeight: (tableTheme.highlightFirstColumn && colIndex === 0) ? '600' : 'normal'
                                                            }}
                                                            onFocus={(e) => e.target.style.borderColor = accentColor}
                                                            onBlur={(e) => e.target.style.borderColor = 'transparent'}
                                                            placeholder="..."
                                                            disabled={tableTheme.numberedFirstColumn && colIndex === 0}
                                                        />
                                                    </td>
                                                ))}
                                                <td className="w-10"></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Add Row Button */}
                                <button
                                    onClick={addRow}
                                    className="mt-2 w-full py-2 rounded-lg border-2 border-dashed transition-all flex items-center justify-center gap-2"
                                    style={{
                                        borderColor: `${accentColor}40`,
                                        color: accentColor
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = `${accentColor}80`;
                                        e.currentTarget.style.backgroundColor = `${accentColor}10`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = `${accentColor}40`;
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Row
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <button
                                onClick={handlePasteFromClipboard}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Paste table from clipboard"
                            >
                                <ClipboardPaste className="w-5 h-5 text-gray-500" />
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 rounded-xl text-white font-medium transition-all flex items-center gap-2 shadow-lg"
                                    style={{ backgroundColor: accentColor }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                        e.currentTarget.style.boxShadow = `0 8px 16px ${accentColor}40`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                                    }}
                                >
                                    <Check className="w-4 h-4" />
                                    Apply Changes
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
