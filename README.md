# ☕ Java Champions Social Media Analytics

> **Discover the social footprint of the Java Champions community**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-Powered-45ba4b?logo=playwright&logoColor=white)](https://playwright.dev/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A toolkit to scrape, analyze, and visualize social media metrics for all **300+ Java Champions** worldwide. Track Twitter/X followers, GitHub contributions, and podcast appearances.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install
npx playwright install chromium

# Start scraping Twitter/X
npm run scrape
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🐦 **Twitter/X Scraper** | Collects follower counts with login-wall bypass |
| 🐙 **GitHub Scraper** | Fetches repos, followers, and contributions via `gh` CLI |
| 🎙️ **Podcast Scraper** | Discovers podcast appearances *(coming soon)* |
| 📊 **Interactive Dashboards** | Beautiful HTML visualizations of all metrics |
| 💾 **Resume Support** | Pick up right where you left off after interruptions |
| ⚡ **Rate Limit Friendly** | Smart delays to avoid API blocks |

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run scrape` | Scrape Twitter/X with browser login |
| `npm run scrape:api` | Scrape Twitter using API v2 (requires keys) |
| `npm run scrape:github` | Scrape GitHub profiles via `gh` CLI |
| `npm run scrape:podcasts` | Scrape podcast appearances |

---

## 🏗️ How It Works

```
┌──────────────────────────────────────────────────────────────────┐
│                     java-champions.yml                            │
│         (fetched from aalmiray/java-champions repo)              │
└────────────────────────────┬─────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   Twitter    │ │    GitHub    │ │   Podcasts   │
    │   Scraper    │ │   Scraper    │ │   Scraper    │
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │                │                │
           ▼                ▼                ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ twitter.json │ │  github.json │ │ podcasts.json│
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │                │                │
           └────────────────┼────────────────┘
                            ▼
                  ┌──────────────────┐
                  │  📊 Dashboards   │
                  │   (HTML + CSS)   │
                  └──────────────────┘
```

---

## 🐦 Twitter/X Scraper

### Prerequisites
- Node.js 18+
- A Twitter/X account (required due to login wall)

### How It Works

1. 🌐 Opens a Chromium browser window
2. 🔐 Prompts for login (first run only — session is persisted)
3. 📋 Visits each Java Champion's Twitter profile
4. 📈 Extracts follower counts
5. 💾 Saves results incrementally to JSON

### Output

```json
{
  "timestamp": "2026-01-30T...",
  "total": 349,
  "successful": 320,
  "results": [
    { "handle": "techgirl1908", "name": "Angie Jones", "followers": 116000 },
    { "handle": "brunoborges", "name": "Bruno Borges", "followers": 42000 }
  ]
}
```

---

## 🐙 GitHub Scraper

### Prerequisites
- [GitHub CLI (`gh`)](https://cli.github.com/) installed and authenticated

```bash
# Authenticate GitHub CLI
gh auth login

# Run the scraper
npm run scrape:github
```

---

## 📊 Dashboards

Open the HTML dashboards in your browser to explore the data:

```bash
open dashboards/index.html
```

---

## 🔧 Configuration

Key settings are defined in the scraper files:

| Setting | Default | Description |
|---------|---------|-------------|
| `batchSize` | 10 | Save results every N profiles |
| `delay` | 4000ms (Twitter) / 100ms (GitHub) | Delay between requests |
| `.browser-data/` | — | Persistent browser session (gitignored) |

---

## 📁 Project Structure

```
jchamp-github-program/
├── scrapers/
│   ├── twitter/         # Twitter/X scrapers
│   ├── github/          # GitHub scraper
│   └── podcasts/        # Podcast scraper
├── dashboards/          # HTML visualization dashboards
├── java-champions.yml   # Local cache of champions data
└── package.json
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

---

## 📜 License

ISC © Java Champions Community

---

<p align="center">
  <sub>Built with ❤️ for the Java Champions community</sub>
</p>
