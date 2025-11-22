import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'

dotenv.config()

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

let win: BrowserWindow | null

const DEFAULT_DATA_PATH = path.join(app.getPath('userData'), 'calendar-data.json');
let currentDataPath = DEFAULT_DATA_PATH;

async function loadSettings() {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    try {
        if (existsSync(settingsPath)) {
            const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
            if (settings.dataPath) currentDataPath = settings.dataPath;
        }
    } catch (e) {
        console.error('Failed to load settings', e);
    }
}

function createWindow() {
    win = new BrowserWindow({
        width: 1200, height: 800, frame: false, titleBarStyle: 'hidden',
        titleBarOverlay: { color: '#00000000', symbolColor: '#4b5563', height: 30 },
        webPreferences: { preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true },
        backgroundColor: '#00000000'
    })
    Menu.setApplicationMenu(null);
    win.webContents.on('did-finish-load', () => win?.webContents.send('main-process-message', (new Date).toLocaleString()))
    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL)
        win.webContents.openDevTools()
    } else {
        win.loadFile(path.join(process.env.DIST || '', 'index.html'))
    }
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })

app.whenReady().then(async () => {
    await loadSettings();
    createWindow();

    ipcMain.handle('summarize-text', async (_, text) => {
        try {
            if (!process.env.GEMINI_API_KEY) return text.slice(0, 50) + '...';
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(text);
            return (await result.response).text();
        } catch (error) {
            return text.slice(0, 50) + '...';
        }
    });

    ipcMain.handle('get-creator-stats', async () => {
        win?.webContents.executeJavaScript(`console.log("🚀 Fetching all Fortnite metrics + history...")`);
        try {
            const codes = ['7891-5057-6642', '3432-9922-9130', '9754-2475-5004', '7835-5469-3381', '8941-4567-5858', '0127-9034-1922', '2559-5465-1064', '7145-9468-2691'];
            const now = new Date();
            const ago7 = new Date(now); ago7.setDate(now.getDate() - 7);
            const from = ago7.toISOString(), to = now.toISOString();

            const metrics = ['minutes-played', 'unique-players', 'favorites', 'plays'];
            const results: any = { minutesPlayed: 0, uniquePlayers: 0, favorites: 0, plays: 0 };

            for (const metric of metrics) {
                const promises = codes.map(async (code) => {
                    try {
                        const url = `https://api.fortnite.com/ecosystem/v1/islands/${code}/metrics/day/${metric}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
                        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
                        if (res.ok) {
                            const data = await res.json();
                            return data.intervals?.reduce((s: number, i: any) => s + (i.value || 0), 0) || 0;
                        }
                        return 0;
                    } catch { return 0; }
                });
                const vals = await Promise.all(promises);
                const total = vals.reduce((s, v) => s + v, 0);
                if (metric === 'minutes-played') results.minutesPlayed = total;
                else if (metric === 'unique-players') results.uniquePlayers = total;
                else if (metric === 'favorites') results.favorites = total;
                else if (metric === 'plays') results.plays = total;
                win?.webContents.executeJavaScript(`console.log("✅ ${metric}: ${total}")`);
            }

            const statsPath = path.join(app.getPath('userData'), 'fortnite-stats-history.json');
            let history: any = { snapshots: [], allTime: { minutesPlayed: 0, uniquePlayers: 0, favorites: 0, plays: 0 } };
            try {
                if (existsSync(statsPath)) history = JSON.parse(await fs.readFile(statsPath, 'utf-8'));
            } catch { }

            const today = new Date().toISOString().split('T')[0];
            const existing = history.snapshots.find((s: any) => s.date === today);

            if (!existing) {
                history.snapshots.push({ date: today, ...results });
                const dayMaxes: any = {};
                history.snapshots.forEach((s: any) => {
                    if (!dayMaxes[s.date] || s.minutesPlayed > dayMaxes[s.date].minutesPlayed) dayMaxes[s.date] = s;
                });
                history.allTime = { minutesPlayed: 0, uniquePlayers: 0, favorites: 0, plays: 0 };
                Object.values(dayMaxes).forEach((s: any) => {
                    history.allTime.minutesPlayed += s.minutesPlayed || 0;
                    history.allTime.uniquePlayers = Math.max(history.allTime.uniquePlayers, s.uniquePlayers || 0);
                    history.allTime.favorites = Math.max(history.allTime.favorites, s.favorites || 0);
                    history.allTime.plays += s.plays || 0;
                });
                await fs.writeFile(statsPath, JSON.stringify(history, null, 2));
                win?.webContents.executeJavaScript(`console.log("💾 Saved ${today} snapshot")`);
            } else {
                win?.webContents.executeJavaScript(`console.log("ℹ️ Using cached all-time data")`);
            }

            const fmt = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toString();
            win?.webContents.executeJavaScript(`console.log("📊 All-time: ${fmt(history.allTime.minutesPlayed)} min, ${fmt(history.allTime.uniquePlayers)} players, ${fmt(history.allTime.favorites)} favs, ${fmt(history.allTime.plays)} plays")`);

            return {
                fortnite: {
                    minutesPlayed: fmt(history.allTime.minutesPlayed),
                    uniquePlayers: fmt(history.allTime.uniquePlayers),
                    favorites: fmt(history.allTime.favorites),
                    plays: fmt(history.allTime.plays)
                },
                curseforge: { downloads: '2.5M', username: 'umfhe' }
            };
        } catch (e: any) {
            win?.webContents.executeJavaScript(`console.error("❌ ${e.message}")`);
            return { fortnite: { minutesPlayed: '0', uniquePlayers: '0', favorites: '0', plays: '0' }, curseforge: { downloads: '2.5M', username: 'umfhe' } };
        }
    });

    ipcMain.handle('get-data', async () => {
        try {
            if (!existsSync(currentDataPath)) return { notes: {} };
            return JSON.parse(await fs.readFile(currentDataPath, 'utf-8'));
        } catch { return { notes: {} }; }
    });

    ipcMain.handle('save-data', async (_, data) => {
        try {
            await fs.writeFile(currentDataPath, JSON.stringify(data, null, 2));
            return { success: true };
        } catch (e) { return { success: false, error: e }; }
    });

    ipcMain.handle('select-data-folder', async () => {
        const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
        if (!result.canceled && result.filePaths.length > 0) {
            const newPath = path.join(result.filePaths[0], 'calendar-data.json');
            currentDataPath = newPath;
            const settingsPath = path.join(app.getPath('userData'), 'settings.json');
            await fs.writeFile(settingsPath, JSON.stringify({ dataPath: newPath }));
            return newPath;
        }
        return null;
    });

    ipcMain.handle('get-auto-launch', () => app.getLoginItemSettings().openAtLogin);
    ipcMain.handle('set-auto-launch', (_, openAtLogin) => {
        app.setLoginItemSettings({ openAtLogin, path: app.getPath('exe') });
        return app.getLoginItemSettings().openAtLogin;
    });

    ipcMain.handle('get-username', () => 'Majid');
})
