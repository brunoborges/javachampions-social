# Copilot Instructions for Java Champions Social Media Analysis

## Build and Run Commands

```bash
# Install dependencies
npm install
npx playwright install chromium

# Scrape Twitter/X follower counts (requires login in browser)
npm run scrape

# Scrape GitHub profiles (requires `gh` CLI authenticated)
npm run scrape:github

# Alternative Twitter scrapers
npm run scrape:api          # Uses Twitter API v2
npm run scrape:twitter-simple
```

## Architecture

This is a Node.js data scraping toolkit that collects social media metrics for Java Champions:

- **Data Source**: Fetches the official Java Champions list from `https://raw.githubusercontent.com/aalmiray/java-champions/refs/heads/main/java-champions.yml`
- **Twitter Scrapers**: Use Playwright with persistent browser sessions to work around X/Twitter's login wall
- **GitHub Scraper**: Uses the `gh` CLI to call GitHub API endpoints
- **Dashboards**: Static HTML files (`dashboard.html`, `github-dashboard.html`) that visualize JSON output

### Data Flow

1. Scrapers fetch the remote `java-champions.yml` to get member list with social handles
2. Each scraper visits profiles and extracts metrics
3. Results are saved to JSON files (`twitter-data.json`, `github-data.json`)
4. Dashboards load JSON files for visualization

## Key Conventions

- **Resume Support**: All scrapers track processed handles and resume from where they left off. Existing results are loaded from the output JSON file at startup.
- **Rate Limiting**: Twitter scraper uses 4-second delays; GitHub uses 100ms delays
- **Batch Saving**: Results are saved every 10 profiles (configurable via `CONFIG.batchSize`)
- **Browser Session**: Twitter scraper stores login state in `.browser-data/` directory (gitignored)
- **Graceful Shutdown**: All scrapers handle `SIGINT` to save progress before exiting
