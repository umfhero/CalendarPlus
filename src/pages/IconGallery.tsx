/**
 * Icon Gallery Page
 * Visual reference of Lucide icons used in the application
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

// Import commonly used icons from lucide-react
import {
    // File Type Icons
    FileCode, PenTool, FileText, File, FilePlus,

    // Folder Icons
    Folder, FolderOpen, FolderPlus,

    // Connection & Linking
    Share2, Link, Link2, Link2Off, ExternalLink, Network, Share,
    GitBranch, GitMerge, ArrowRight, ArrowLeft, ArrowUp, ArrowDown,

    // Image & Media
    Image, ImagePlus, ImageOff, Camera, Video, Music, Crop, Maximize2,

    // Navigation & Layout
    Home, LayoutDashboard, LayoutGrid, Compass, Map,
    Bookmark, Star, Clock, History, PanelLeft, PanelLeftOpen, PanelLeftClose,
    Menu,

    // Actions
    Plus, Minus, X, Check, Trash2, Pencil, Edit2, Edit3, Copy, Clipboard,
    Save, Download, Upload, RefreshCw, RotateCcw, Undo, Undo2, Redo, Redo2,
    Search, Filter, ArrowUpDown, SortAsc, SortDesc,
    Play, Pause, StopCircle, SkipForward, SkipBack,
    Volume, Volume1, Volume2, VolumeX,

    // Status & Feedback
    CheckCircle, CheckCircle2, AlertTriangle, AlertCircle, XCircle, Info,
    HelpCircle, Loader, Ban, Circle,

    // Data & Analytics
    BarChart2, PieChart, TrendingUp, TrendingDown, Activity, Target,

    // Notifications
    Bell, BellOff,

    // Time & Calendar
    Calendar, Timer, Hourglass, AlarmClock,

    // Communication
    MessageSquare, MessageCircle, Send, AtSign, Mail, Inbox,

    // AI & Smart Features
    Brain, Wand2, Zap, Lightbulb, Sparkles, Cpu,

    // Organization
    Layers, Archive, Pin, PinOff, Flag, Tag, Hash, Repeat,

    // Security
    Lock, Unlock, Key, Shield, ShieldCheck, ShieldAlert,
    Eye, EyeOff,

    // Design
    Palette, Droplet, Paintbrush, Eraser, Scissors, Pipette,

    // Code & Dev
    Code, Code2, Terminal, Braces, Github, GitCommit, GitPullRequest, GitFork,
    Bug, Wrench, Settings, Settings2, Keyboard, Box,

    // Achievements
    Trophy, Crown, Flame, Award, Medal,

    // Users
    User, Users, UserPlus, UserMinus, UserCheck, UserX,

    // Chevrons & Arrows
    ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
    ChevronsLeft, ChevronsRight, ChevronsUp, ChevronsDown,
    ArrowUpRight,

    // Reactions
    Heart, ThumbsUp, ThumbsDown, Smile, Frown, Meh,

    // Zoom
    ZoomIn, ZoomOut,

    // Misc
    BookOpen, FileUp, GripVertical, Calculator, Mic, List, MoreVertical,
    Cloud, Merge, Rocket, Globe, Database, DollarSign,
    Type, ClipboardPaste,

    // Type for icon component
    LucideIcon,
} from 'lucide-react';

// Define icon categories with their icons
interface IconEntry {
    name: string;
    icon: LucideIcon;
    usage?: string; // Where it's used in the app
}

interface IconCategory {
    name: string;
    description: string;
    defaultColor: string;
    icons: IconEntry[];
}

// Preset colors for quick selection
const presetColors = [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#eab308', // Yellow
    '#84cc16', // Lime
    '#22c55e', // Green
    '#10b981', // Emerald
    '#14b8a6', // Teal
    '#06b6d4', // Cyan
    '#0ea5e9', // Sky
    '#6366f1', // Indigo
    '#64748b', // Slate
];

const iconCategories: IconCategory[] = [
    {
        name: '📁 File Types',
        description: 'Icons for different file types in the workspace',
        defaultColor: '#3b82f6',
        icons: [
            { name: 'FileCode', icon: FileCode, usage: 'Notebook (.exec)' },
            { name: 'PenTool', icon: PenTool, usage: 'Board (.brd)' },
            { name: 'FileText', icon: FileText, usage: 'Quick Note (.nt)' },
            { name: 'File', icon: File },
            { name: 'FilePlus', icon: FilePlus },
            { name: 'FileUp', icon: FileUp, usage: 'Settings import' },
        ],
    },
    {
        name: '📂 Folders',
        description: 'Folder icons for organization',
        defaultColor: '#f59e0b',
        icons: [
            { name: 'Folder', icon: Folder, usage: 'Settings, Dashboard' },
            { name: 'FolderOpen', icon: FolderOpen, usage: 'File explorer' },
            { name: 'FolderPlus', icon: FolderPlus, usage: 'New folder' },
        ],
    },
    {
        name: '🔗 Connections',
        description: 'Linking and connection icons',
        defaultColor: '#8b5cf6',
        icons: [
            { name: 'Share2', icon: Share2, usage: 'Linked Notes Graph' },
            { name: 'Link', icon: Link, usage: '@ Connections, Board' },
            { name: 'Link2', icon: Link2 },
            { name: 'Link2Off', icon: Link2Off, usage: 'Remove connection' },
            { name: 'ExternalLink', icon: ExternalLink, usage: 'Settings, GitHub' },
            { name: 'Network', icon: Network },
            { name: 'Share', icon: Share },
            { name: 'GitBranch', icon: GitBranch },
            { name: 'GitMerge', icon: GitMerge },
            { name: 'GitFork', icon: GitFork, usage: 'GitHub page' },
            { name: 'Merge', icon: Merge, usage: 'Dashboard' },
        ],
    },
    {
        name: '🧭 Navigation',
        description: 'Navigation and layout icons',
        defaultColor: '#10b981',
        icons: [
            { name: 'Home', icon: Home, usage: 'Sidebar, TabBar' },
            { name: 'LayoutDashboard', icon: LayoutDashboard, usage: 'Settings' },
            { name: 'LayoutGrid', icon: LayoutGrid, usage: 'GitHub, Dashboard' },
            { name: 'Compass', icon: Compass },
            { name: 'Map', icon: Map },
            { name: 'Bookmark', icon: Bookmark },
            { name: 'Clock', icon: Clock, usage: 'Timer, Quick Timer' },
            { name: 'History', icon: History, usage: 'Timer, Settings' },
            { name: 'PanelLeft', icon: PanelLeft, usage: 'TabBar' },
            { name: 'PanelLeftOpen', icon: PanelLeftOpen, usage: 'Sidebar' },
            { name: 'PanelLeftClose', icon: PanelLeftClose, usage: 'Sidebar, TabBar' },
            { name: 'Menu', icon: Menu },
        ],
    },
    {
        name: '✏️ Actions',
        description: 'Common action icons',
        defaultColor: '#ec4899',
        icons: [
            { name: 'Plus', icon: Plus, usage: 'Calendar, Board, many' },
            { name: 'Minus', icon: Minus },
            { name: 'X', icon: X, usage: 'Close buttons everywhere' },
            { name: 'Check', icon: Check, usage: 'Confirmations, Settings' },
            { name: 'Trash2', icon: Trash2, usage: 'Delete actions everywhere' },
            { name: 'Pencil', icon: Pencil, usage: 'Rename, Board' },
            { name: 'Edit2', icon: Edit2, usage: 'Notebook, Calendar' },
            { name: 'Edit3', icon: Edit3 },
            { name: 'Copy', icon: Copy },
            { name: 'Clipboard', icon: Clipboard, usage: 'Settings' },
            { name: 'ClipboardPaste', icon: ClipboardPaste, usage: 'Table Editor' },
            { name: 'Save', icon: Save, usage: 'Settings, Widgets' },
            { name: 'Download', icon: Download, usage: 'Dev Tools, Updates' },
            { name: 'Upload', icon: Upload, usage: 'Board, Settings' },
            { name: 'RefreshCw', icon: RefreshCw, usage: 'Dev Tools, Widgets' },
            { name: 'RotateCcw', icon: RotateCcw, usage: 'Timer, Shortcuts' },
            { name: 'Undo', icon: Undo, usage: 'Drawing' },
            { name: 'Undo2', icon: Undo2, usage: 'Table Editor' },
            { name: 'Redo', icon: Redo, usage: 'Drawing' },
            { name: 'Redo2', icon: Redo2, usage: 'Table Editor' },
            { name: 'Search', icon: Search, usage: 'Dashboard, Notebook, many' },
            { name: 'Filter', icon: Filter, usage: 'Dashboard, Progress' },
            { name: 'ArrowUpDown', icon: ArrowUpDown, usage: 'File Tree sorting' },
            { name: 'SortAsc', icon: SortAsc, usage: 'Notebook' },
            { name: 'SortDesc', icon: SortDesc, usage: 'Notebook' },
        ],
    },
    {
        name: '▶️ Media Controls',
        description: 'Play, pause, and media icons',
        defaultColor: '#06b6d4',
        icons: [
            { name: 'Play', icon: Play, usage: 'Timer, Widgets' },
            { name: 'Pause', icon: Pause, usage: 'Timer' },
            { name: 'StopCircle', icon: StopCircle, usage: 'Timer' },
            { name: 'SkipForward', icon: SkipForward },
            { name: 'SkipBack', icon: SkipBack },
            { name: 'Volume', icon: Volume },
            { name: 'Volume1', icon: Volume1 },
            { name: 'Volume2', icon: Volume2 },
            { name: 'VolumeX', icon: VolumeX },
            { name: 'Mic', icon: Mic, usage: 'Board' },
        ],
    },
    {
        name: '🎯 Status',
        description: 'Status and feedback icons',
        defaultColor: '#22c55e',
        icons: [
            { name: 'CheckCircle', icon: CheckCircle },
            { name: 'CheckCircle2', icon: CheckCircle2, usage: 'Dashboard, Progress' },
            { name: 'AlertTriangle', icon: AlertTriangle, usage: 'Notifications, Dev' },
            { name: 'AlertCircle', icon: AlertCircle, usage: 'AI Modal, Settings' },
            { name: 'XCircle', icon: XCircle, usage: 'Dashboard' },
            { name: 'Info', icon: Info, usage: 'Notifications, Settings' },
            { name: 'HelpCircle', icon: HelpCircle, usage: 'Progress' },
            { name: 'Loader', icon: Loader, usage: 'GitHub, Dashboard' },
            { name: 'Ban', icon: Ban },
            { name: 'Circle', icon: Circle, usage: 'Dashboard, Progress' },
        ],
    },
    {
        name: '📊 Analytics',
        description: 'Charts and data icons',
        defaultColor: '#f97316',
        icons: [
            { name: 'BarChart2', icon: BarChart2, usage: 'Timer, Widgets' },
            { name: 'PieChart', icon: PieChart, usage: 'Sidebar, Progress' },
            { name: 'TrendingUp', icon: TrendingUp, usage: 'Stats, Progress, Settings' },
            { name: 'TrendingDown', icon: TrendingDown, usage: 'Progress, TaskTrend' },
            { name: 'Activity', icon: Activity, usage: 'Dashboard, Widgets' },
            { name: 'Target', icon: Target, usage: 'Progress, Setup' },
            { name: 'ArrowUpRight', icon: ArrowUpRight, usage: 'Dashboard, Progress' },
        ],
    },
    {
        name: '🔔 Notifications',
        description: 'Bell and notification icons',
        defaultColor: '#eab308',
        icons: [
            { name: 'Bell', icon: Bell, usage: 'Settings, Timer Alert' },
            { name: 'BellOff', icon: BellOff, usage: 'Settings' },
        ],
    },
    {
        name: '📅 Time',
        description: 'Calendar and time icons',
        defaultColor: '#a855f7',
        icons: [
            { name: 'Calendar', icon: Calendar, usage: 'Sidebar, Settings, Stats' },
            { name: 'Timer', icon: Timer, usage: 'Sidebar, Quick Timer' },
            { name: 'Hourglass', icon: Hourglass },
            { name: 'AlarmClock', icon: AlarmClock },
        ],
    },
    {
        name: '✨ AI & Smart',
        description: 'AI and smart feature icons',
        defaultColor: '#d946ef',
        icons: [
            { name: 'Sparkles', icon: Sparkles, usage: 'AI features everywhere' },
            { name: 'Brain', icon: Brain },
            { name: 'Wand2', icon: Wand2, usage: 'AI Backbone Generator' },
            { name: 'Zap', icon: Zap, usage: 'File tree Quick Notes' },
            { name: 'Lightbulb', icon: Lightbulb },
            { name: 'Cpu', icon: Cpu, usage: 'Widgets' },
        ],
    },
    {
        name: '💬 Communication',
        description: 'Chat and messaging icons',
        defaultColor: '#14b8a6',
        icons: [
            { name: 'MessageSquare', icon: MessageSquare, usage: 'Board, Setup' },
            { name: 'MessageCircle', icon: MessageCircle },
            { name: 'Send', icon: Send },
            { name: 'AtSign', icon: AtSign },
            { name: 'Mail', icon: Mail },
            { name: 'Inbox', icon: Inbox },
        ],
    },
    {
        name: '🏷️ Organization',
        description: 'Tags and organization icons',
        defaultColor: '#84cc16',
        icons: [
            { name: 'Tag', icon: Tag },
            { name: 'Hash', icon: Hash },
            { name: 'Layers', icon: Layers, usage: 'Drawing, Notebook' },
            { name: 'Archive', icon: Archive },
            { name: 'Pin', icon: Pin },
            { name: 'PinOff', icon: PinOff },
            { name: 'Flag', icon: Flag, usage: 'Calendar, Progress' },
            { name: 'Repeat', icon: Repeat, usage: 'AI Modal, Dashboard' },
        ],
    },
    {
        name: '🔐 Security',
        description: 'Security and privacy icons',
        defaultColor: '#ef4444',
        icons: [
            { name: 'Lock', icon: Lock },
            { name: 'Unlock', icon: Unlock },
            { name: 'Key', icon: Key },
            { name: 'Shield', icon: Shield, usage: 'Setup Wizard' },
            { name: 'ShieldCheck', icon: ShieldCheck },
            { name: 'ShieldAlert', icon: ShieldAlert },
            { name: 'Eye', icon: Eye },
            { name: 'EyeOff', icon: EyeOff },
        ],
    },
    {
        name: '🖼️ Media',
        description: 'Image and media icons',
        defaultColor: '#0ea5e9',
        icons: [
            { name: 'Image', icon: Image, usage: 'File Tree, Board, Gallery' },
            { name: 'ImagePlus', icon: ImagePlus },
            { name: 'ImageOff', icon: ImageOff },
            { name: 'Camera', icon: Camera, usage: 'Dev Tools' },
            { name: 'Video', icon: Video },
            { name: 'Music', icon: Music },
            { name: 'Crop', icon: Crop, usage: 'Image Editor' },
            { name: 'Maximize2', icon: Maximize2, usage: 'Image Editor, Graph' },
            { name: 'ZoomIn', icon: ZoomIn, usage: 'Linked Notes Graph' },
            { name: 'ZoomOut', icon: ZoomOut, usage: 'Linked Notes Graph' },
        ],
    },
    {
        name: '🎨 Design',
        description: 'Creative and design icons',
        defaultColor: '#f472b6',
        icons: [
            { name: 'Palette', icon: Palette, usage: 'Settings, Themes, Table' },
            { name: 'Droplet', icon: Droplet },
            { name: 'Paintbrush', icon: Paintbrush },
            { name: 'Eraser', icon: Eraser },
            { name: 'Scissors', icon: Scissors },
            { name: 'Pipette', icon: Pipette, usage: 'Board' },
            { name: 'Type', icon: Type, usage: 'Drawing, Settings' },
        ],
    },
    {
        name: '💻 Code',
        description: 'Development and code icons',
        defaultColor: '#6366f1',
        icons: [
            { name: 'Code', icon: Code, usage: 'Sidebar, GitHub' },
            { name: 'Code2', icon: Code2 },
            { name: 'Terminal', icon: Terminal },
            { name: 'Braces', icon: Braces },
            { name: 'Github', icon: Github, usage: 'Sidebar, Settings, GitHub' },
            { name: 'GitCommit', icon: GitCommit },
            { name: 'GitPullRequest', icon: GitPullRequest },
            { name: 'Bug', icon: Bug, usage: 'Settings' },
            { name: 'Wrench', icon: Wrench },
            { name: 'Settings', icon: Settings, usage: 'Sidebar' },
            { name: 'Settings2', icon: Settings2, usage: 'Settings' },
            { name: 'Keyboard', icon: Keyboard, usage: 'Shortcuts' },
            { name: 'Box', icon: Box, usage: 'Dashboard, GitHub' },
        ],
    },
    {
        name: '🏆 Achievements',
        description: 'Trophy and achievement icons',
        defaultColor: '#fbbf24',
        icons: [
            { name: 'Trophy', icon: Trophy, usage: 'Stats' },
            { name: 'Crown', icon: Crown, usage: 'Progress' },
            { name: 'Flame', icon: Flame, usage: 'Progress' },
            { name: 'Award', icon: Award },
            { name: 'Medal', icon: Medal },
            { name: 'Star', icon: Star, usage: 'GitHub' },
        ],
    },
    {
        name: '👤 Users',
        description: 'User and people icons',
        defaultColor: '#64748b',
        icons: [
            { name: 'User', icon: User },
            { name: 'Users', icon: Users, usage: 'Stats' },
            { name: 'UserPlus', icon: UserPlus },
            { name: 'UserMinus', icon: UserMinus },
            { name: 'UserCheck', icon: UserCheck },
            { name: 'UserX', icon: UserX },
        ],
    },
    {
        name: '◀️ Chevrons',
        description: 'Chevron and arrow icons',
        defaultColor: '#78716c',
        icons: [
            { name: 'ChevronLeft', icon: ChevronLeft, usage: 'Calendar, Navigation' },
            { name: 'ChevronRight', icon: ChevronRight, usage: 'Calendar, Sidebar' },
            { name: 'ChevronUp', icon: ChevronUp, usage: 'Timer, Settings' },
            { name: 'ChevronDown', icon: ChevronDown, usage: 'Timer, File Tree' },
            { name: 'ChevronsLeft', icon: ChevronsLeft },
            { name: 'ChevronsRight', icon: ChevronsRight },
            { name: 'ChevronsUp', icon: ChevronsUp },
            { name: 'ChevronsDown', icon: ChevronsDown },
            { name: 'ArrowLeft', icon: ArrowLeft, usage: 'Connections Panel' },
            { name: 'ArrowRight', icon: ArrowRight, usage: 'Connections Panel' },
            { name: 'ArrowUp', icon: ArrowUp, usage: 'Table Editor' },
            { name: 'ArrowDown', icon: ArrowDown, usage: 'Table Editor' },
        ],
    },
    {
        name: '❤️ Reactions',
        description: 'Emoji and reaction icons',
        defaultColor: '#fb7185',
        icons: [
            { name: 'Heart', icon: Heart, usage: 'Settings, Setup' },
            { name: 'ThumbsUp', icon: ThumbsUp, usage: 'Progress' },
            { name: 'ThumbsDown', icon: ThumbsDown },
            { name: 'Smile', icon: Smile },
            { name: 'Frown', icon: Frown },
            { name: 'Meh', icon: Meh },
        ],
    },
    {
        name: '📦 Misc',
        description: 'Miscellaneous utility icons',
        defaultColor: '#94a3b8',
        icons: [
            { name: 'BookOpen', icon: BookOpen, usage: 'Notebook, Quick Capture' },
            { name: 'GripVertical', icon: GripVertical, usage: 'Drawing layers' },
            { name: 'Calculator', icon: Calculator, usage: 'Board notes' },
            { name: 'List', icon: List, usage: 'Board' },
            { name: 'MoreVertical', icon: MoreVertical, usage: 'Board' },
            { name: 'Cloud', icon: Cloud, usage: 'Setup, Widgets' },
            { name: 'Rocket', icon: Rocket, usage: 'Dev Tools, Widgets' },
            { name: 'Globe', icon: Globe, usage: 'Widgets' },
            { name: 'Database', icon: Database, usage: 'Widgets' },
            { name: 'DollarSign', icon: DollarSign, usage: 'Widgets' },
        ],
    },
];

export default function IconGallery() {
    const { theme, accentColor } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedIcon, setCopiedIcon] = useState<string | null>(null);
    const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});

    // Get the color for a category (custom or default)
    const getCategoryColor = (categoryName: string, defaultColor: string) => {
        return categoryColors[categoryName] || defaultColor;
    };

    // Set custom color for a category
    const setCategoryColor = (categoryName: string, color: string) => {
        setCategoryColors(prev => ({ ...prev, [categoryName]: color }));
    };

    // Filter icons based on search
    const filteredCategories = useMemo(() => {
        if (!searchQuery) return iconCategories;

        const query = searchQuery.toLowerCase();
        return iconCategories
            .map(cat => ({
                ...cat,
                icons: cat.icons.filter(
                    icon =>
                        icon.name.toLowerCase().includes(query) ||
                        icon.usage?.toLowerCase().includes(query)
                ),
            }))
            .filter(cat => cat.icons.length > 0);
    }, [searchQuery]);

    const totalIcons = useMemo(() =>
        iconCategories.reduce((acc, cat) => acc + cat.icons.length, 0),
        []
    );

    const usedIconsCount = useMemo(() =>
        iconCategories.reduce((acc, cat) => acc + cat.icons.filter(i => i.usage).length, 0),
        []
    );

    const handleCopyIcon = (iconName: string) => {
        navigator.clipboard.writeText(iconName);
        setCopiedIcon(iconName);
        setTimeout(() => setCopiedIcon(null), 1500);
    };

    return (
        <div className={clsx(
            'h-full p-6 overflow-y-auto custom-scrollbar',
            theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
        )}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className={clsx(
                        'text-3xl font-bold mb-2',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    )}>
                        🎨 Icon Gallery
                    </h1>
                    <p className={clsx(
                        'text-lg',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                        {totalIcons} Lucide icons • {usedIconsCount} actively used in ThoughtsPlus
                    </p>
                </div>

                {/* Search */}
                <div className="mb-8">
                    <div className={clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-xl border',
                        theme === 'dark'
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-200'
                    )}>
                        <Search className={clsx(
                            'w-5 h-5',
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                        )} />
                        <input
                            type="text"
                            placeholder="Search icons by name or usage..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={clsx(
                                'flex-1 bg-transparent outline-none text-lg',
                                theme === 'dark'
                                    ? 'text-white placeholder:text-gray-500'
                                    : 'text-gray-900 placeholder:text-gray-400'
                            )}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className={clsx(
                                    'p-1 rounded-lg transition-colors',
                                    theme === 'dark'
                                        ? 'hover:bg-gray-700 text-gray-400'
                                        : 'hover:bg-gray-100 text-gray-500'
                                )}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Categories */}
                <div className="space-y-10">
                    {filteredCategories.map((category) => {
                        const categoryColor = getCategoryColor(category.name, category.defaultColor);

                        return (
                            <motion.div
                                key={category.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {/* Category Header with Color Picker */}
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h2 className={clsx(
                                            'text-xl font-semibold mb-1',
                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        )}>
                                            {category.name}
                                        </h2>
                                        <p className={clsx(
                                            'text-sm',
                                            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                                        )}>
                                            {category.description}
                                        </p>
                                    </div>

                                    {/* Color Picker */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {presetColors.slice(0, 8).map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => setCategoryColor(category.name, color)}
                                                    className={clsx(
                                                        'w-5 h-5 rounded-full border-2 transition-transform hover:scale-110',
                                                        categoryColor === color
                                                            ? 'border-white shadow-lg scale-110'
                                                            : 'border-transparent'
                                                    )}
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                />
                                            ))}
                                        </div>
                                        <input
                                            type="color"
                                            value={categoryColor}
                                            onChange={(e) => setCategoryColor(category.name, e.target.value)}
                                            className="w-6 h-6 rounded cursor-pointer border-0"
                                            title="Custom color"
                                        />
                                        {categoryColors[category.name] && (
                                            <button
                                                onClick={() => {
                                                    const newColors = { ...categoryColors };
                                                    delete newColors[category.name];
                                                    setCategoryColors(newColors);
                                                }}
                                                className={clsx(
                                                    'text-xs px-2 py-1 rounded',
                                                    theme === 'dark'
                                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                )}
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Icons Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                    {category.icons.map((iconEntry) => {
                                        const IconComponent = iconEntry.icon;
                                        const isCopied = copiedIcon === iconEntry.name;

                                        return (
                                            <motion.button
                                                key={iconEntry.name}
                                                onClick={() => handleCopyIcon(iconEntry.name)}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className={clsx(
                                                    'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                                                    theme === 'dark'
                                                        ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                                                        : 'bg-white border-gray-200 hover:shadow-md hover:border-gray-300'
                                                )}
                                                title={iconEntry.usage ? `Used in: ${iconEntry.usage}` : 'Click to copy name'}
                                            >
                                                <div
                                                    className="p-3 rounded-lg"
                                                    style={{
                                                        backgroundColor: isCopied
                                                            ? `${accentColor}20`
                                                            : `${categoryColor}15`
                                                    }}
                                                >
                                                    {isCopied ? (
                                                        <Check
                                                            className="w-6 h-6"
                                                            style={{ color: accentColor }}
                                                        />
                                                    ) : (
                                                        <IconComponent
                                                            className="w-6 h-6"
                                                            style={{ color: categoryColor }}
                                                        />
                                                    )}
                                                </div>
                                                <span className={clsx(
                                                    'text-xs font-mono text-center leading-tight',
                                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                                )}>
                                                    {iconEntry.name}
                                                </span>
                                                {iconEntry.usage && (
                                                    <span className={clsx(
                                                        'text-[10px] text-center px-2 py-0.5 rounded-full',
                                                        theme === 'dark'
                                                            ? 'bg-green-900/30 text-green-400'
                                                            : 'bg-green-100 text-green-700'
                                                    )}>
                                                        ✓ Used
                                                    </span>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* No Results */}
                {filteredCategories.length === 0 && (
                    <div className={clsx(
                        'text-center py-16',
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    )}>
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No icons found for "{searchQuery}"</p>
                    </div>
                )}

                {/* Footer */}
                <div className={clsx(
                    'mt-12 text-center py-8 border-t',
                    theme === 'dark' ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'
                )}>
                    <p>
                        Icons from{' '}
                        <a
                            href="https://lucide.dev/icons/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-500"
                        >
                            Lucide React
                        </a>
                        {' '}• Click any icon to copy its name • Green badge = actively used
                    </p>
                </div>
            </div>
        </div>
    );
}
