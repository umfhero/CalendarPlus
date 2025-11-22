import { Home, Calendar as CalendarIcon, BarChart2, Settings, ChevronDown, ChevronRight, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { Page, NotesData } from '../App';
import logoPng from '../assets/calendar_icon_181520.png';

interface SidebarProps {
    currentPage: Page;
    setPage: (page: Page) => void;
    notes: NotesData;
    onMonthSelect?: (monthIndex: number) => void;
    currentMonth?: Date;
}

const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'stats', icon: BarChart2, label: 'Creator Stats' },
    { id: 'settings', icon: Settings, label: 'Settings' },
] as const;

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export function Sidebar({ currentPage, setPage, notes, onMonthSelect, currentMonth }: SidebarProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(true);

    // Auto-minimize calendar dropdown if not on calendar page
    useEffect(() => {
        if (currentPage !== 'calendar') {
            setIsCalendarOpen(false);
        } else {
            setIsCalendarOpen(true);
        }
    }, [currentPage]);

    const getNoteCountForMonth = (monthIndex: number) => {
        let count = 0;
        const currentYear = new Date().getFullYear();

        Object.keys(notes).forEach(dateStr => {
            const date = new Date(dateStr);
            if (date.getMonth() === monthIndex && date.getFullYear() === currentYear) {
                count += notes[dateStr].length;
            }
        });
        return count;
    };

    const currentMonthIndex = currentMonth ? currentMonth.getMonth() : new Date().getMonth();

    return (
        <div className="w-72 h-full p-6 flex flex-col relative z-30">
            <div className="mb-10 flex items-center gap-3 px-2">
                <img src={logoPng} alt="Logo" className="w-10 h-10 object-contain drop-shadow-lg" />
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
                    Calendar Pro
                </h1>
            </div>

            <nav className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {/* Dashboard */}
                <motion.button
                    onClick={() => setPage('dashboard')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={clsx(
                        "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative group font-medium",
                        currentPage === 'dashboard' ? "text-blue-600 shadow-lg shadow-blue-500/10" : "text-gray-500 hover:text-gray-800"
                    )}
                >
                    {currentPage === 'dashboard' && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-white rounded-2xl"
                            initial={false}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
                        />
                    )}
                    <Home className="w-5 h-5 relative z-10" strokeWidth={currentPage === 'dashboard' ? 2.5 : 2} />
                    <span className="relative z-10">Dashboard</span>
                </motion.button>

                {/* Calendar Dropdown */}
                <div className="space-y-1">
                    <motion.button
                        onClick={() => {
                            setPage('calendar');
                            setIsCalendarOpen(!isCalendarOpen);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={clsx(
                            "w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 relative group font-medium",
                            currentPage === 'calendar' ? "text-blue-600 shadow-lg shadow-blue-500/10" : "text-gray-500 hover:text-gray-800"
                        )}
                    >
                        {currentPage === 'calendar' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-white rounded-2xl"
                                initial={false}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
                            />
                        )}
                        <div className="flex items-center gap-4 relative z-10">
                            <CalendarIcon className="w-5 h-5" strokeWidth={currentPage === 'calendar' ? 2.5 : 2} />
                            <span>Calendar</span>
                        </div>
                        <div className="relative z-10">
                            {isCalendarOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                    </motion.button>

                    <AnimatePresence>
                        {isCalendarOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden pl-4 space-y-1"
                            >
                                {months.map((month, index) => {
                                    const count = getNoteCountForMonth(index);
                                    const isCurrentMonth = index === currentMonthIndex;
                                    return (
                                        <div
                                            key={month}
                                            className={clsx(
                                                "flex items-center justify-between px-4 py-3 text-sm rounded-xl transition-all cursor-pointer relative overflow-hidden group",
                                                isCurrentMonth ? "bg-white/80 shadow-sm text-blue-600 font-bold backdrop-blur-sm" : "text-gray-500 hover:text-gray-800 hover:bg-white/40"
                                            )}
                                            onClick={() => {
                                                setPage('calendar');
                                                if (onMonthSelect) onMonthSelect(index);
                                            }}
                                        >
                                            <span className="relative z-10">{month}</span>
                                            {count > 0 && (
                                                <div className="flex items-center gap-2 relative z-10">
                                                    <motion.div
                                                        whileHover={{ rotate: 15, scale: 1.2 }}
                                                        className="bg-white/50 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-white/50"
                                                    >
                                                        <Bell className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                                                    </motion.div>
                                                    <span className="text-black font-bold text-xs">{count}</span>
                                                </div>
                                            )}
                                            {isCurrentMonth && (
                                                <motion.div
                                                    layoutId="activeMonth"
                                                    className="absolute inset-0 bg-white/50 rounded-xl"
                                                    initial={false}
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Other Items */}
                {navItems.slice(1).map((item) => {
                    const isActive = currentPage === item.id;
                    const Icon = item.icon;

                    return (
                        <motion.button
                            key={item.id}
                            onClick={() => setPage(item.id as Page)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={clsx(
                                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative group font-medium",
                                isActive ? "text-blue-600 shadow-lg shadow-blue-500/10" : "text-gray-500 hover:text-gray-800"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white rounded-2xl"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
                                />
                            )}

                            <Icon className="w-5 h-5 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
                            <span className="relative z-10">{item.label}</span>
                        </motion.button>
                    );
                })}
            </nav>
        </div>
    );
}
