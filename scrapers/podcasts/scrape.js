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

// Helper to extract episode number from a title string
function extractEpisodeNumber(title) {
  if (!title) return null;
  // Common patterns: "#119", "Episode 119", "Ep 119", "LCC 335", "#88:", "Podcast #88"
  const patterns = [
    /#(\d+)/,                    // #119
    /\bEp\.?\s*(\d+)/i,          // Ep 119, Ep. 119
    /\bEpisode\s*(\d+)/i,        // Episode 119
    /\bLCC\s*(\d+)/i,            // LCC 335
    /\b(\d{2,})\b/,              // Any 2+ digit number
  ];
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) return parseInt(match[1]);
  }
  return null;
}

// Special handlers for podcasts that need custom scraping
// Add entries here when standard RSS/Atom parsing doesn't work
const SPECIAL_HANDLERS = {
  // Airhacks: Use the direct airhacks.fm feed
  'Airhacks': async (podcast) => {
    console.log('    Using special handler: fetching airhacks.fm RSS feed directly');
    const feedUrl = 'https://airhacks.fm/episodes/feed.xml';
    try {
      const res = await fetch(feedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PodcastScraper/1.0)' }
      });
      const xml = await res.text();
      
      const itemMatches = xml.match(/<item[\s>]/gi) || [];
      let episodeCount = itemMatches.length;
      
      // Extract latest episode title and get episode number if present
      const titleMatch = xml.match(/<item[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const latestEpisodeTitle = titleMatch ? titleMatch[1].trim() : null;
      
      const epNum = extractEpisodeNumber(latestEpisodeTitle);
      if (epNum && epNum > episodeCount) episodeCount = epNum;
      
      const pubDateMatch = xml.match(/<item[\s\S]*?<pubDate>([^<]+)<\/pubDate>/i);
      const lastEpisodeDate = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : null;
      
      return {
        feedUrl,
        episodeCount,
        description: 'podcast with adam bien',
        lastEpisodeDate,
        latestEpisodeTitle,
      };
    } catch (e) {
      console.log(`    Error: ${e.message}`);
      return null;
    }
  },

  // Stackd: Use the pubhouse.net podcast-specific feed
  'Stackd': async (podcast) => {
    console.log('    Using special handler: fetching Stackd podcast RSS feed');
    const feedUrl = 'https://www.pubhouse.net/podcasts/the-stackd-podcast/feed/';
    try {
      const res = await fetch(feedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PodcastScraper/1.0)' }
      });
      const xml = await res.text();
      
      const itemMatches = xml.match(/<item[\s>]/gi) || [];
      let episodeCount = itemMatches.length;
      
      const titleMatch = xml.match(/<item[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const latestEpisodeTitle = titleMatch ? titleMatch[1].trim() : null;
      
      const epNum = extractEpisodeNumber(latestEpisodeTitle);
      if (epNum && epNum > episodeCount) episodeCount = epNum;
      
      const descMatch = xml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
      const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim().slice(0, 200) : null;
      
      const pubDateMatch = xml.match(/<item[\s\S]*?<pubDate>([^<]+)<\/pubDate>/i);
      const lastEpisodeDate = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : null;
      
      return {
        feedUrl,
        episodeCount,
        description: description || 'The Stackd Podcast - Pub House Network',
        lastEpisodeDate,
        latestEpisodeTitle,
      };
    } catch (e) {
      console.log(`    Error: ${e.message}`);
      return null;
    }
  },

  // Happy Path Programming: Anchor.fm feed is now behind Spotify, scrape from website
  'Happy Path Programming': async (podcast) => {
    console.log('    Using special handler: scraping episode numbers from website');
    const res = await fetch(podcast.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PodcastScraper/1.0)' }
    });
    const html = await res.text();
    
    // Find highest episode number in the page (e.g., "#119 FP Reaches...")
    const episodeMatches = html.match(/#(\d+)\s+[A-Z]/g) || [];
    const episodeNumbers = episodeMatches.map(m => parseInt(m.match(/\d+/)[0]));
    const episodeCount = episodeNumbers.length > 0 ? Math.max(...episodeNumbers) : null;
    
    // Extract latest episode title
    const titleMatch = html.match(/#(\d+)\s+([^<\n]+)/);
    const latestEpisodeTitle = titleMatch ? `#${titleMatch[1]} ${titleMatch[2].trim()}` : null;
    
    return {
      feedUrl: 'https://creators.spotify.com/pod/show/happypathprogramming',
      episodeCount,
      description: podcast.description || 'No-frills discussions between Bruce Eckel and James Ward about programming.',
      lastEpisodeDate: null,
      latestEpisodeTitle,
    };
  },

  // Devrel Radio: YouTube channel, count videos from YouTube RSS feed
  'Devrel Radio': async (podcast) => {
    console.log('    Using special handler: parsing YouTube RSS feed');
    const feedUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=UCazQCYpjkotqMKHg1ddj2eQ';
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PodcastScraper/1.0)' }
    });
    const xml = await res.text();
    
    // Count <entry> elements (YouTube videos)
    const entryMatches = xml.match(/<entry>/gi) || [];
    const episodeCount = entryMatches.length;
    
    // Extract latest video title
    const titleMatch = xml.match(/<entry>[\s\S]*?<title>([^<]+)<\/title>/);
    const latestEpisodeTitle = titleMatch ? titleMatch[1].trim() : null;
    
    // Extract latest video date
    const dateMatch = xml.match(/<entry>[\s\S]*?<published>([^<]+)<\/published>/);
    const lastEpisodeDate = dateMatch ? new Date(dateMatch[1]).toISOString() : null;
    
    return {
      feedUrl,
      episodeCount,
      description: 'The podcast where we Tune In to the Heart of Developer Relations!',
      lastEpisodeDate,
      latestEpisodeTitle,
    };
  },
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
    
    // Detect if this is an Atom feed
    const isAtom = xml.includes('<feed') && xml.includes('xmlns="http://www.w3.org/2005/Atom"');
    
    let episodeCount, description, lastEpisodeDate, latestEpisodeTitle;
    
    if (isAtom) {
      // Parse Atom feed
      const entryMatches = xml.match(/<entry[\s>]/gi) || [];
      episodeCount = entryMatches.length;
      
      // For numbered podcasts like "LCC 335", extract episode number from title
      const titleMatches = xml.match(/<entry>[\s\S]*?<title[^>]*>([^<]+)<\/title>/gi) || [];
      if (titleMatches.length > 0) {
        const firstTitle = titleMatches[0].match(/<title[^>]*>([^<]+)<\/title>/i);
        if (firstTitle) {
          latestEpisodeTitle = firstTitle[1].trim();
          const epNum = extractEpisodeNumber(latestEpisodeTitle);
          if (epNum && epNum > episodeCount) {
            episodeCount = epNum;
          }
        }
      }
      
      // Extract description from subtitle or description
      const descMatch = xml.match(/<subtitle[^>]*>([^<]+)<\/subtitle>/i) || 
                        xml.match(/<summary[^>]*>([^<]+)<\/summary>/i);
      description = descMatch ? descMatch[1].trim().slice(0, 300) : null;
      
      // Extract last episode date
      const dateMatch = xml.match(/<entry>[\s\S]*?<published>([^<]+)<\/published>/i) ||
                        xml.match(/<entry>[\s\S]*?<updated>([^<]+)<\/updated>/i);
      lastEpisodeDate = dateMatch ? new Date(dateMatch[1]).toISOString() : null;
      
    } else {
      // Parse RSS feed
      const itemMatches = xml.match(/<item[\s>]/gi) || [];
      episodeCount = itemMatches.length;
      
      // Extract podcast description
      const descMatch = xml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
      description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim().slice(0, 300) : null;
      
      // Extract last episode date
      const pubDateMatch = xml.match(/<pubDate>([^<]+)<\/pubDate>/i);
      lastEpisodeDate = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : null;
      
      // Extract latest episode title
      const itemMatch = xml.match(/<item[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      latestEpisodeTitle = itemMatch ? itemMatch[1].trim().slice(0, 200) : null;
      
      // Try to get total episode count from iTunes episode numbers or title numbers
      const itunesCountMatch = xml.match(/<itunes:episode>(\d+)<\/itunes:episode>/gi);
      if (itunesCountMatch) {
        const maxEpisodeNum = Math.max(...itunesCountMatch.map(m => parseInt(m.match(/\d+/)[0])));
        if (maxEpisodeNum > episodeCount) {
          episodeCount = maxEpisodeNum;
        }
      }
      
      // Also try extracting from latest episode title
      const epNumFromTitle = extractEpisodeNumber(latestEpisodeTitle);
      if (epNumFromTitle && epNumFromTitle > episodeCount) {
        episodeCount = epNumFromTitle;
      }
    }
    
    return {
      feedUrl,
      episodeCount,
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
    // Check if this podcast has a special handler
    if (SPECIAL_HANDLERS[podcast.title]) {
      const specialData = await SPECIAL_HANDLERS[podcast.title](podcast);
      if (specialData) {
        result.feedUrl = specialData.feedUrl;
        result.episodeCount = specialData.episodeCount;
        result.description = specialData.description;
        result.lastEpisodeDate = specialData.lastEpisodeDate;
        result.latestEpisodeTitle = specialData.latestEpisodeTitle;
        console.log(`    ✓ ${specialData.episodeCount} episodes found (special handler)`);
        return result;
      }
    }
    
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
