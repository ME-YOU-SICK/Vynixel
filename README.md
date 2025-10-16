<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

<div align="center">
  <img alt="Vynixel" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" width="100%" />
  <h1>Vynixel</h1>
  <p>Visual AI blueprint builder for founders and product teams.</p>

  <p>
    <a href="#-features">Features</a>
    ·
    <a href="#-quick-start">Quick Start</a>
    ·
    <a href="#-configuration">Configuration</a>
    ·
    <a href="#-architecture">Architecture</a>
    ·
    <a href="#-roadmap">Roadmap</a>
  </p>
</div>

## ✨ Features

- Provider-agnostic AI
  - Google Gemini via `@google/genai` (streaming JSON)
  - OpenRouter (any model, e.g. `meituan/longcat-flash-chat:free`)
- Per-user AI settings (stored locally per signed-in user)
  - Provider, API Key, and Model selectable in-app
  - Custom model names supported
- Visual canvas with node graph
  - Action menu to generate structured sections (Idea, Personas, PRD, MVP, etc.)
  - Re-generate, custom prompts, analysis node
  - Smooth pan/zoom, minimap, node resizing
- Export to PDF
  - Live preview, include/exclude sections, AI-generate missing sections
- Auth
  - Google OAuth 2.0 (server-side session)
- Theming
  - Light/Dark with class-based toggle

## 🚀 Quick Start

Prerequisites: Node.js 18+

1) Install dependencies

```bash
npm install
```

2) Set environment variables (same terminal)

```powershell
# Google OAuth (required for sign-in)
$env:GOOGLE_CLIENT_ID="your-client-id"
$env:GOOGLE_CLIENT_SECRET="your-client-secret"
$env:OAUTH_CALLBACK_URL="http://localhost:4000/auth/google/callback"  # optional, default shown

# Optional Gemini key (you can also enter keys in Settings per user)
$env:GEMINI_API_KEY="your-gemini-key"
```

3) Start backend + frontend

```bash
npm run dev:full
```

4) Open http://localhost:3000 and Sign In with Google. Set provider, model, and API key in Settings as needed (e.g., OpenRouter with `meituan/longcat-flash-chat:free`).

## ⚙️ Configuration

You can run Vynixel with no baked-in secrets. For production, prefer server-side keys and a backend proxy.

- Google OAuth (required)
  - Google Cloud Console → OAuth 2.0 Client (Web application)
  - Authorized JavaScript origins: `http://localhost:3000`
  - Authorized redirect URIs: `http://localhost:4000/auth/google/callback`

- Gemini
  - Option A: Set `GEMINI_API_KEY` in the environment
  - Option B: Enter a key per-user in Settings (stored locally per user)

- OpenRouter
  - Enter your OpenRouter API key in Settings
  - Enter exact model name (e.g., `meituan/longcat-flash-chat:free`)
  - Responses are non-streaming in this build

## 🧭 Scripts

- `npm run dev` — start Vite dev server (frontend)
- `npm run server` — start Express OAuth server (backend)
- `npm run dev:full` — run frontend and backend together
- `npm run build` — build frontend
- `npm run preview` — preview production build

## 🏗 Architecture

- Frontend: React + TypeScript + Vite + Zustand + Tailwind (PostCSS)
- Auth: Express + Passport (Google OAuth) + express-session
- AI services:
  - Gemini via `@google/genai`, model and key read at runtime from user settings
  - OpenRouter via `fetch` to `https://openrouter.ai/api/v1/chat/completions`
- Persistence:
  - Node graph and per-user Settings saved in `localStorage` (scoped by user email)

Key files:

- `server/index.js` — OAuth routes (`/auth/google`, callback, `/api/me`, `/auth/logout`)
- `services/geminiService.ts` — prompt building, provider switching, streaming/non-streaming handling
- `store.ts` — global state (nodes, settings, export, AI actions)
- `components/*` — canvas, nodes, export modal, settings, etc.

## 🔐 Security Notes

- Do not ship client-bundled API keys. Use server-side proxy/keys in production.
- Enable HTTPS and set secure cookies for production (`express-session` `secure: true`).

## 🗺 Roadmap

- Provider adapters for OpenAI/Anthropic/Mistral with streaming
- Real database persistence for graphs and settings
- Team collaboration and sharing links
- Rich export templates and formats (Markdown/Docx)

## 📄 License

MIT — see `LICENSE` (or add one if missing).
