# NexOS 🖥️

> Electron製デスクトップOSシェル。Windows / macOS / Linux で動くアプリとして配布可能。

![platform](https://img.shields.io/badge/platform-Win%20%7C%20Mac%20%7C%20Linux-blue)
![electron](https://img.shields.io/badge/Electron-29-47848F?logo=electron)
![license](https://img.shields.io/badge/license-MIT-green)

---

## 機能

- 🖥 **デスクトップ環境** — ウィンドウ管理、ドラッグ移動、リサイズ、最大化/最小化
- 📦 **アプリストア** — 16種類のアプリをインストール/アンインストール
- 💻 **ターミナル** — コマンドライン、コマンド履歴、neofetch
- 📁 **ファイルマネージャ** — Electronの実際のファイルシステムに読み書き
- 📝 **テキストエディタ** — シンタックス対応、ファイル保存
- 🧮 **電卓** / 🕐 **時計+タイマー** / 📌 **付箋**
- 🐍 **スネークゲーム** / 🎨 **ペイント** / 📊 **システムモニタ**
- 🌤 **天気** / 📋 **Markdownプレビュー** / 🎵 **音楽プレーヤー**
- ⚙️ **設定** — テーマ6種、壁紙、アクセントカラー、OS名を変更
- 🔔 **通知システム** / システムトレイ対応

---

## ローカルで動かす

```bash
git clone https://github.com/YOUR_USERNAME/nexos.git
cd nexos
npm install
npm start
```

---

## ビルド（配布用バイナリ）

```bash
npm run build:win    # Windows → dist/*.exe
npm run build:mac    # macOS   → dist/*.dmg
npm run build:linux  # Linux   → dist/*.AppImage
```

---

## GitHub で公開する手順

### 1. package.json を編集
```json
"author": "あなたの名前",
"owner": "あなたのGitHubユーザー名"
```

### 2. リポジトリ作成
github.com → ＋ → New repository → `nexos` → Public → Create

### 3. プッシュ
```bash
git init
git add .
git commit -m "🚀 NexOS v1.0"
git remote add origin https://github.com/ユーザー名/nexos.git
git branch -M main
git push -u origin main
```

### 4. Secret 設定
Settings → Secrets → New → `GH_TOKEN` = Personal Access Token (`repo`スコープ)

### 5. リリース
```bash
git tag v1.0.0
git push origin v1.0.0
```
→ GitHub Actions が自動で Win/Mac/Linux バイナリをビルドして Releases に公開

---

## ファイル構成

```
nexos/
├── src/
│   ├── main.js      # Electronメインプロセス・IPC・ファイルシステム
│   ├── preload.js   # セキュアなAPI橋渡し
│   └── shell.html   # OSシェル本体（デスクトップ + 全アプリ）
├── assets/
│   └── icon.png
├── .github/workflows/build.yml
└── package.json
```

## ライセンス
MIT
