import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Trophy, Download, ExternalLink, Users, Clock, Heart } from 'lucide-react';

interface StatsData {
    fortnite: {
        rank: string;
        players: string;
        minutes: string;
        followers: string;
    };
    curseforge: {
        downloads: string;
        username: string;
        avatar: string;
    };
}

export function StatsPage() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            // @ts-ignore
            const data = await window.ipcRenderer.invoke('get-creator-stats');
            setStats(data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch stats');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return (
        <div className="p-10 space-y-10 h-full overflow-y-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Creator Stats</h1>
                    <p className="text-gray-500">Live metrics from your platforms</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={fetchStats}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 shadow-lg shadow-gray-200/50 text-gray-700 font-bold hover:text-blue-600 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Data
                </motion.button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 font-medium">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Fortnite Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                    className="p-8 rounded-[2rem] bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-100 shadow-xl shadow-orange-100/50 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                        <Trophy className="w-40 h-40 text-yellow-500" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-yellow-500">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Fortnite Creator</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50">
                                <div className="flex items-center gap-2 mb-1 text-yellow-700">
                                    <Trophy className="w-4 h-4" />
                                    <p className="text-xs font-bold uppercase tracking-wider">Rank</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats?.fortnite.rank || '---'}</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50">
                                <div className="flex items-center gap-2 mb-1 text-yellow-700">
                                    <Users className="w-4 h-4" />
                                    <p className="text-xs font-bold uppercase tracking-wider">Players Now</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats?.fortnite.players || '---'}</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50">
                                <div className="flex items-center gap-2 mb-1 text-yellow-700">
                                    <Clock className="w-4 h-4" />
                                    <p className="text-xs font-bold uppercase tracking-wider">Minutes Played</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats?.fortnite.minutes || '---'}</p>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50">
                                <div className="flex items-center gap-2 mb-1 text-yellow-700">
                                    <Heart className="w-4 h-4" />
                                    <p className="text-xs font-bold uppercase tracking-wider">Followers</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats?.fortnite.followers || '---'}</p>
                            </div>
                        </div>

                        <a
                            href="https://fortnite.gg/creator?name=majid"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 mt-8 px-4 py-2 rounded-lg bg-white/50 hover:bg-white text-sm font-bold text-gray-600 hover:text-yellow-600 transition-all"
                        >
                            View Profile <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </motion.div>

                {/* CurseForge Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ y: -5 }}
                    className="p-8 rounded-[2rem] bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100 shadow-xl shadow-red-100/50 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                        <Download className="w-40 h-40 text-orange-500" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            {stats?.curseforge.avatar ? (
                                <img src={stats.curseforge.avatar} alt="Avatar" className="w-12 h-12 rounded-2xl shadow-sm" />
                            ) : (
                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-orange-500">
                                    <Download className="w-6 h-6" />
                                </div>
                            )}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">CurseForge</h2>
                                <p className="text-orange-600 font-medium">{stats?.curseforge.username || 'Loading...'}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Downloads</p>
                                <p className="text-5xl font-bold text-gray-900 tracking-tight">
                                    {stats?.curseforge.downloads || '---'}
                                </p>
                            </div>
                        </div>

                        <a
                            href="https://www.curseforge.com/members/umf/projects"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 mt-8 px-4 py-2 rounded-lg bg-white/50 hover:bg-white text-sm font-bold text-gray-600 hover:text-orange-600 transition-all"
                        >
                            View Projects <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
