# Twitter Follower Scraper for Java Champions

This tool scrapes Twitter/X follower counts for all Java Champions.

## Prerequisites

- Node.js 18+
- A Twitter/X account (required due to login wall)

## Installation

```bash
npm install
npx playwright install chromium
```

## Usage

```bash
npm run scrape
```

The script will:
1. Open a browser window
2. If not logged in, prompt you to log in to X/Twitter
3. Visit each Java Champion's Twitter profile
4. Extract follower counts
5. Save results to `twitter-followers.json`

## Features

- **Persistent session**: Your login is saved, so you only need to log in once
- **Resume support**: If interrupted, run again to continue where you left off
- **Rate limiting**: 4-second delay between requests to avoid blocks
- **Progress saving**: Results saved every 10 profiles

## Output

Results are saved to `twitter-followers.json`:

```json
{
  "timestamp": "2026-01-30T...",
  "total": 349,
  "successful": 320,
  "results": [
    { "handle": "techgirl1908", "name": "Angie Jones", "followers": 116000 },
    ...
  ]
}
```

## Notes

- Twitter/X requires authentication to view profiles
- The browser runs in visible mode so you can log in
- Session data is stored in `.browser-data/` directory
- Add `.browser-data/` to `.gitignore` to avoid committing session data
