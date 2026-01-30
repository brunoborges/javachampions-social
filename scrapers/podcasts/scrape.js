const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Configuration
const CONFIG = {
  yamlUrl: 'https://github.com/aalmiray/java-champions/raw/refs/heads/main/podcasts.yml',
  outputFile: path.join(__dirname, 'data.json'),
  batchSize: 5,
  timeout: 15000,
};

// Try to find RSS feed URL from podcast website
async function findRssFeed(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
    
    const res = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PodcastScraper/1.0)' }
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) return null;
    
    const html = await res.text();
    
    // Look for RSS/Atom feed links in HTML
    const feedPatterns = [
      /<link[^>]+type=["']application\/rss\+xml["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+type=["']application\/rss\+xml["']/i,
      /<link[^>]+type=["']application\/atom\+xml["'][^>]+href=["']([^"']+)["']/i,
      /["'](https?:\/\/[^"']*feed[^"']*\.xml)["']/i,
      /["'](https?:\/\/[^"']*rss[^"']*\.xml)["']/i,
      /["'](https?:\/\/feeds\.[^"']+)["']/i,
    ];
    
    for (const pattern of feedPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let feedUrl = match[1];
        // Handle relative URLs
        if (feedUrl.startsWith('/')) {
          const baseUrl = new URL(url);
          feedUrl = `${baseUrl.protocol}//${baseUrl.host}${feedUrl}`;
        }
        return feedUrl;
      }
    }
    
    // Try common feed paths
    const commonPaths = ['/feed', '/feed.xml', '/rss', '/rss.xml', '/podcast.xml', '/feed/podcast'];
    const baseUrl = new URL(url);
    
    for (const feedPath of commonPaths) {
      try {
        const feedUrl = `${baseUrl.protocol}//${baseUrl.host}${feedPath}`;
        const feedRes = await fetch(feedUrl, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        if (feedRes.ok) {
          const contentType = feedRes.headers.get('content-type') || '';
          if (contentType.includes('xml') || contentType.includes('rss')) {
            return feedUrl;
          }
        }
      } catch (e) {
        // Continue trying other paths
      }
    }
    
    return null;
  } catch (e) {
    console.log(`    Could not fetch ${url}: ${e.message}`);
    return null;
  }
}

// Parse RSS feed and extract episode info
async function parseRssFeed(feedUrl) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
    
    const res = await fetch(feedUrl, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PodcastScraper/1.0)' }
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) return null;
    
    const xml = await res.text();
    
    // Extract episode count
    const itemMatches = xml.match(/<item[\s>]/gi) || [];
    const episodeCount = itemMatches.length;
    
    // Extract podcast description
    const descMatch = xml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim().slice(0, 300) : null;
    
    // Extract last episode date
    const pubDateMatch = xml.match(/<pubDate>([^<]+)<\/pubDate>/i);
    const lastEpisodeDate = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : null;
    
    // Extract latest episode title
    const itemMatch = xml.match(/<item[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const latestEpisodeTitle = itemMatch ? itemMatch[1].trim().slice(0, 200) : null;
    
    // Try to get total episode count from iTunes
    const itunesCountMatch = xml.match(/<itunes:episode>(\d+)<\/itunes:episode>/gi);
    const maxEpisodeNum = itunesCountMatch 
      ? Math.max(...itunesCountMatch.map(m => parseInt(m.match(/\d+/)[0])))
      : null;
    
    return {
      feedUrl,
      episodeCount: maxEpisodeNum || episodeCount,
      description,
      lastEpisodeDate,
      latestEpisodeTitle,
    };
  } catch (e) {
    console.log(`    Could not parse feed ${feedUrl}: ${e.message}`);
    return null;
  }
}

// Fetch podcast data from YAML
async function getPodcasts() {
  console.log('📥 Fetching podcasts YAML...');
  
  const response = await fetch(CONFIG.yamlUrl);
  const yamlText = await response.text();
  const data = yaml.parse(yamlText);
  
  console.log(`Found ${data.podcasts.length} podcasts\n`);
  return data.podcasts;
}

// Process a single podcast
async function processPodcast(podcast) {
  console.log(`🎙️  ${podcast.title}`);
  
  const result = {
    title: podcast.title,
    url: podcast.url,
    logo: podcast.logo,
    language: podcast.language,
    hosts: podcast.hosts?.map(h => h.name) || [],
    social: podcast.social || {},
    feedUrl: null,
    episodeCount: null,
    description: null,
    lastEpisodeDate: null,
    latestEpisodeTitle: null,
    error: null,
  };
  
  try {
    // Find RSS feed
    console.log(`    Looking for RSS feed...`);
    const feedUrl = await findRssFeed(podcast.url);
    
    if (feedUrl) {
      console.log(`    Found feed: ${feedUrl}`);
      result.feedUrl = feedUrl;
      
      // Parse feed
      const feedData = await parseRssFeed(feedUrl);
      if (feedData) {
        result.episodeCount = feedData.episodeCount;
        result.description = feedData.description;
        result.lastEpisodeDate = feedData.lastEpisodeDate;
        result.latestEpisodeTitle = feedData.latestEpisodeTitle;
        console.log(`    ✓ ${feedData.episodeCount} episodes found`);
      }
    } else {
      console.log(`    ⚠ No RSS feed found`);
    }
  } catch (e) {
    result.error = e.message;
    console.log(`    ✗ Error: ${e.message}`);
  }
  
  return result;
}

// Save results to file
function saveResults(results) {
  const data = {
    timestamp: new Date().toISOString(),
    count: results.length,
    results,
  };
  
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(data, null, 2));
  console.log(`\n💾 Saved ${results.length} podcasts to ${CONFIG.outputFile}`);
}

// Main function
async function main() {
  console.log('🎧 Java Champions Podcast Scraper\n');
  console.log('━'.repeat(60));
  
  const podcasts = await getPodcasts();
  const results = [];
  
  for (const podcast of podcasts) {
    const result = await processPodcast(podcast);
    results.push(result);
    
    // Save periodically
    if (results.length % CONFIG.batchSize === 0) {
      saveResults(results);
    }
  }
  
  saveResults(results);
  
  // Print summary
  console.log('\n' + '━'.repeat(60));
  console.log('📊 Summary');
  console.log('━'.repeat(60));
  
  const withFeed = results.filter(r => r.feedUrl);
  const totalEpisodes = results.reduce((sum, r) => sum + (r.episodeCount || 0), 0);
  
  console.log(`Total podcasts: ${results.length}`);
  console.log(`With RSS feeds: ${withFeed.length}`);
  console.log(`Total episodes: ${totalEpisodes}`);
  console.log(`Languages: ${[...new Set(results.map(r => r.language))].join(', ')}`);
}

main().catch(console.error);
