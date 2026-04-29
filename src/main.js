const { app, BrowserWindow, ipcMain, dialog, shell, Menu, Tray, nativeImage } = require('electron');
const path  = require('path');
const fs    = require('fs');
const os    = require('os');

const IS_DEV = process.argv.includes('--dev');
const USER_DATA = app.getPath('userData');
const FS_ROOT   = path.join(USER_DATA, 'nexos_fs');
const CFG_FILE  = path.join(USER_DATA, 'nexos_config.json');
const APPS_FILE = path.join(USER_DATA, 'nexos_apps.json');

// ── ファイルシステム初期化 ─────────────────────────
function initFS() {
  const dirs = ['Desktop','Documents','Downloads','Pictures','Music','Videos','Apps'];
  dirs.forEach(d => fs.mkdirSync(path.join(FS_ROOT, d), { recursive: true }));

  const readme = path.join(FS_ROOT, 'Documents', 'readme.txt');
  if (!fs.existsSync(readme))
    fs.writeFileSync(readme, 'NexOS へようこそ！\nこのOSはElectron製のデスクトップシェルです。\n', 'utf-8');
}

// ── デフォルト設定 ────────────────────────────────
function loadConfig() {
  if (fs.existsSync(CFG_FILE)) {
    try { return JSON.parse(fs.readFileSync(CFG_FILE, 'utf-8')); } catch(e) {}
  }
  return {
    theme: 'dark_cyber', accent: '#4f9cff', wallpaper: 'grid',
    taskbarPos: 'bottom', font: 'system', showClock: true,
    osName: 'NexOS', firstRun: true
  };
}
function saveConfig(cfg) {
  fs.writeFileSync(CFG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
}

// ── インストール済みアプリ管理 ─────────────────────
function loadInstalledApps() {
  if (fs.existsSync(APPS_FILE)) {
    try { return JSON.parse(fs.readFileSync(APPS_FILE, 'utf-8')); } catch(e) {}
  }
  // デフォルトプリインストール
  return ['terminal','filemanager','texteditor','calculator','settings','appstore'];
}
function saveInstalledApps(apps) {
  fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2), 'utf-8');
}

// ─────────────────────────────────────────────────
let mainWin, tray;

function createWindow() {
  initFS();
  const cfg = loadConfig();

  mainWin = new BrowserWindow({
    width: 1280, height: 800,
    minWidth: 800, minHeight: 600,
    frame: false,
    backgroundColor: '#08090d',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false   // Blob iframeのため
    },
    show: false,
    icon: getIconPath()
  });

  mainWin.loadFile(path.join(__dirname, 'shell.html'));
  mainWin.once('ready-to-show', () => {
    mainWin.show();
    if (IS_DEV) mainWin.webContents.openDevTools({ mode: 'detach' });
  });

  // システムトレイ
  createTray(cfg.osName || 'NexOS');

  mainWin.on('closed', () => { mainWin = null; });
}

function getIconPath() {
  const ext = process.platform === 'win32' ? 'ico' : process.platform === 'darwin' ? 'icns' : 'png';
  const p = path.join(__dirname, '..', 'assets', `icon.${ext}`);
  return fs.existsSync(p) ? p : undefined;
}

function createTray(name) {
  try {
    const iconP = path.join(__dirname, '..', 'assets', 'icon.png');
    if (!fs.existsSync(iconP)) return;
    tray = new Tray(nativeImage.createFromPath(iconP).resize({ width:16, height:16 }));
    const ctxMenu = Menu.buildFromTemplate([
      { label: name, enabled: false },
      { type: 'separator' },
      { label: '表示', click: () => mainWin?.show() },
      { label: '最小化', click: () => mainWin?.minimize() },
      { type: 'separator' },
      { label: '終了', click: () => app.quit() }
    ]);
    tray.setContextMenu(ctxMenu);
    tray.setToolTip(name);
    tray.on('double-click', () => mainWin?.show());
  } catch(e) { /* トレイなしで続行 */ }
}

// ═══════════════════════════════════════════════
// IPC ハンドラ群
// ═══════════════════════════════════════════════

// ── 設定 ──
ipcMain.handle('cfg:load', () => loadConfig());
ipcMain.handle('cfg:save', (_, cfg) => { saveConfig(cfg); return true; });

// ── アプリ管理 ──
ipcMain.handle('apps:list',      ()       => loadInstalledApps());
ipcMain.handle('apps:install',   (_, id)  => {
  const apps = loadInstalledApps();
  if (!apps.includes(id)) { apps.push(id); saveInstalledApps(apps); }
  return apps;
});
ipcMain.handle('apps:uninstall', (_, id)  => {
  const PROTECTED = ['terminal','settings','appstore'];
  if (PROTECTED.includes(id)) return { error: 'このアプリは削除できません' };
  const apps = loadInstalledApps().filter(a => a !== id);
  saveInstalledApps(apps);
  return apps;
});

// ── ファイルシステム ──
ipcMain.handle('fs:list', (_, rel) => {
  const dir = path.join(FS_ROOT, rel || '');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).map(name => {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    return { name, isDir: stat.isDirectory(), size: stat.size, mtime: stat.mtimeMs };
  });
});
ipcMain.handle('fs:read', (_, rel) => {
  const p = path.join(FS_ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf-8');
});
ipcMain.handle('fs:write', (_, rel, content) => {
  const p = path.join(FS_ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf-8');
  return true;
});
ipcMain.handle('fs:delete', (_, rel) => {
  const p = path.join(FS_ROOT, rel);
  if (fs.existsSync(p)) {
    const stat = fs.statSync(p);
    stat.isDirectory() ? fs.rmdirSync(p, { recursive: true }) : fs.unlinkSync(p);
  }
  return true;
});
ipcMain.handle('fs:mkdir', (_, rel) => {
  fs.mkdirSync(path.join(FS_ROOT, rel), { recursive: true });
  return true;
});
ipcMain.handle('fs:exists', (_, rel) => fs.existsSync(path.join(FS_ROOT, rel)));
ipcMain.handle('fs:root', () => FS_ROOT);

// ── ダイアログ ──
ipcMain.handle('dialog:open', async (_, opts) => {
  const r = await dialog.showOpenDialog(mainWin, opts || {});
  return r;
});
ipcMain.handle('dialog:save', async (_, opts) => {
  const r = await dialog.showSaveDialog(mainWin, opts || {});
  return r;
});
ipcMain.handle('dialog:message', async (_, opts) => {
  const r = await dialog.showMessageBox(mainWin, opts || {});
  return r;
});

// ── システム情報 ──
ipcMain.handle('sys:info', () => ({
  platform: process.platform,
  arch: os.arch(),
  cpus: os.cpus().length,
  totalMem: os.totalmem(),
  freeMem:  os.freemem(),
  hostname: os.hostname(),
  user: os.userInfo().username,
  uptime: os.uptime(),
  nodeVersion: process.versions.node,
  electronVersion: process.versions.electron,
  appVersion: app.getVersion(),
}));

// ── ウィンドウコントロール ──
ipcMain.on('win:minimize', () => mainWin?.minimize());
ipcMain.on('win:maximize', () => mainWin?.isMaximized() ? mainWin.unmaximize() : mainWin?.maximize());
ipcMain.on('win:close',    () => mainWin?.close());
ipcMain.on('win:fullscreen',()=> mainWin?.setFullScreen(!mainWin.isFullScreen()));

// ── 外部URLを開く ──
ipcMain.on('shell:open', (_, url) => shell.openExternal(url));

// ── ターミナルコマンド（安全な疑似実行） ──
ipcMain.handle('term:exec', async (_, cmd) => {
  const { execSync } = require('child_process');
  try {
    // ホワイトリスト方式
    const safe = ['echo','pwd','whoami','date','node --version','npm --version'];
    const isSafe = safe.some(s => cmd.trim().startsWith(s));
    if (!isSafe) return { out: `[NexOS Shell] ${cmd}\n実行しました (サンドボックスモード)`, err: '' };
    const out = execSync(cmd, { timeout: 3000, encoding: 'utf-8' });
    return { out, err: '' };
  } catch(e) {
    return { out: '', err: e.message };
  }
});

// ─────────────────────────────────────────────────
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
