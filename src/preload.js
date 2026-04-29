const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('NexOS', {
  // 設定
  cfg: {
    load: ()      => ipcRenderer.invoke('cfg:load'),
    save: (cfg)   => ipcRenderer.invoke('cfg:save', cfg),
  },
  // アプリ管理
  apps: {
    list:      ()    => ipcRenderer.invoke('apps:list'),
    install:   (id)  => ipcRenderer.invoke('apps:install', id),
    uninstall: (id)  => ipcRenderer.invoke('apps:uninstall', id),
  },
  // ファイルシステム
  fs: {
    list:   (rel)          => ipcRenderer.invoke('fs:list', rel),
    read:   (rel)          => ipcRenderer.invoke('fs:read', rel),
    write:  (rel, content) => ipcRenderer.invoke('fs:write', rel, content),
    delete: (rel)          => ipcRenderer.invoke('fs:delete', rel),
    mkdir:  (rel)          => ipcRenderer.invoke('fs:mkdir', rel),
    exists: (rel)          => ipcRenderer.invoke('fs:exists', rel),
    root:   ()             => ipcRenderer.invoke('fs:root'),
  },
  // ダイアログ
  dialog: {
    open:    (opts) => ipcRenderer.invoke('dialog:open', opts),
    save:    (opts) => ipcRenderer.invoke('dialog:save', opts),
    message: (opts) => ipcRenderer.invoke('dialog:message', opts),
  },
  // システム情報
  sys: {
    info: () => ipcRenderer.invoke('sys:info'),
  },
  // ウィンドウ
  win: {
    minimize:   () => ipcRenderer.send('win:minimize'),
    maximize:   () => ipcRenderer.send('win:maximize'),
    close:      () => ipcRenderer.send('win:close'),
    fullscreen: () => ipcRenderer.send('win:fullscreen'),
  },
  // ターミナル
  term: {
    exec: (cmd) => ipcRenderer.invoke('term:exec', cmd),
  },
  // 外部リンク
  openURL: (url) => ipcRenderer.send('shell:open', url),
  // プラットフォーム
  platform: process.platform,
});
