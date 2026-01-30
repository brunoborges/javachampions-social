const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Configuration
const CONFIG = {
  userDataDir: path.join(__dirname, '.browser-data'),
  delayBetweenRequests: 4000, // 4 seconds to avoid rate limiting
  timeout: 20000,
  outputFile: 'twitter-followers.json',
  yamlUrl: 'https://raw.githubusercontent.com/aalmiray/java-champions/refs/heads/main/java-champions.yml',
  batchSize: 10 // How many to process before saving
};

// Parse follower count string (e.g., "58.1K" -> 58100)
function parseFollowerCount(text) {
  if (!text) return null;
  
  const cleaned = text.trim().replace(/,/g, '').replace(/\s/g, '');
  
  if (cleaned.includes('K')) {
    return Math.round(parseFloat(cleaned.replace('K', '')) * 1000);
  } else if (cleaned.includes('M')) {
    return Math.round(parseFloat(cleaned.replace('M', '')) * 1000000);
  } else {
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? null : num;
  }
}

// Extract Twitter handles from YAML
async function getTwitterHandles() {
  console.log('Fetching Java Champions YAML...');
  
  const response = await fetch(CONFIG.yamlUrl);
  const yamlText = await response.text();
  const data = yaml.parse(yamlText);
  
  const handles = [];
  
  for (const member of data.members) {
    if (member.social?.twitter) {
      const url = member.social.twitter;
      const match = url.match(/(?:twitter|x)\.com\/([^\/\?]+)/i);
      if (match && match[1] !== 'intent' && match[1] !== 'share') {
        handles.push({
          name: member.name,
          handle: match[1],
          url: url
        });
      }
    }
  }
  
  console.log(`Found ${handles.length} Twitter handles\n`);
  return handles;
}

// Scrape a single Twitter profile
async function scrapeProfile(page, handle, name) {
  const url = `https://x.com/${handle}`;
  
  try {
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: CONFIG.timeout 
    });
    
    // Wait for page to stabilize
    await page.waitForTimeout(2500);
    
    // Check for login requirement
    const content = await page.content();
    
    if (content.includes('Sign in to X') && content.includes('Sign up')) {
      // If we hit login wall, we're not logged in
      return { handle, name, followers: null, error: 'Login required' };
    }
    
    // Check if profile exists
    if (content.includes("This account doesn't exist") || content.includes("Account suspended")) {
      return { handle, name, followers: null, error: 'Account unavailable' };
    }
    
    // Try to find followers - multiple patterns
    let followers = null;
    
    // Pattern 1: aria-label on followers link
    const followersLink = await page.$('a[href$="/verified_followers"], a[href$="/followers"]');
    if (followersLink) {
      const text = await followersLink.innerText();
      const match = text.match(/([\d,\.]+[KM]?)/);
      if (match) {
        followers = parseFollowerCount(match[1]);
      }
    }
    
    // Pattern 2: Regex on page content
    if (!followers) {
      const match = content.match(/([\d,]+(?:\.\d+)?[KM]?)\s*(?:&nbsp;)?Followers/i);
      if (match) {
        followers = parseFollowerCount(match[1]);
      }
    }
    
    if (followers !== null) {
      console.log(`  ✓ @${handle}: ${followers.toLocaleString()} followers`);
      return { handle, name, followers };
    } else {
      console.log(`  ⚠ @${handle}: Could not extract count`);
      return { handle, name, followers: null, error: 'Parse failed' };
    }
    
  } catch (error) {
    console.log(`  ❌ @${handle}: ${error.message.slice(0, 50)}`);
    return { handle, name, followers: null, error: error.message.slice(0, 100) };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Twitter/X Follower Scraper for Java Champions             ║');
  console.log('║  Using persistent browser session                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Get all Twitter handles
  const handles = await getTwitterHandles();
  
  // Load existing results
  let results = [];
  let processedHandles = new Set();
  
  if (fs.existsSync(CONFIG.outputFile)) {
    try {
      const existing = JSON.parse(fs.readFileSync(CONFIG.outputFile, 'utf-8'));
      results = existing.results || [];
      processedHandles = new Set(results.map(r => r.handle.toLowerCase()));
      console.log(`Resuming: ${results.length} already processed\n`);
    } catch (e) {
      console.log('Starting fresh...\n');
    }
  }
  
  const remaining = handles.filter(h => !processedHandles.has(h.handle.toLowerCase()));
  console.log(`Remaining to process: ${remaining.length}\n`);
  
  if (remaining.length === 0) {
    printSummary(results);
    return;
  }
  
  // Launch browser with persistent context
  console.log('Launching browser with persistent session...');
  console.log(`User data stored in: ${CONFIG.userDataDir}\n`);
  
  // Ensure directory exists
  if (!fs.existsSync(CONFIG.userDataDir)) {
    fs.mkdirSync(CONFIG.userDataDir, { recursive: true });
  }
  
  const context = await chromium.launchPersistentContext(CONFIG.userDataDir, {
    headless: false, // Show browser so user can log in if needed
    viewport: { width: 1280, height: 800 }
  });
  
  const page = await context.newPage();
  
  // First, navigate to Twitter and check if logged in
  console.log('Checking login status...');
  await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const content = await page.content();
  
  if (content.includes('Sign in to X') || content.includes('Log in')) {
    console.log('\n⚠️  NOT LOGGED IN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Please log in to your X/Twitter account in the browser window.');
    console.log('After logging in, press Enter in this terminal to continue...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Wait for user to press Enter
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    // Check again
    await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
  }
  
  console.log('✓ Ready to scrape profiles\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Process profiles
  let processed = 0;
  
  for (const { handle, name } of remaining) {
    const result = await scrapeProfile(page, handle, name);
    results.push(result);
    processed++;
    
    // Save periodically
    if (processed % CONFIG.batchSize === 0) {
      saveResults(results);
      console.log(`\n📁 Saved ${results.length} results (${processed}/${remaining.length} this session)\n`);
    }
    
    // Delay between requests
    await page.waitForTimeout(CONFIG.delayBetweenRequests);
  }
  
  await context.close();
  
  // Final save
  saveResults(results);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Scraping Complete!');
  printSummary(results);
}

function saveResults(results) {
  const successful = results.filter(r => r.followers !== null);
  
  const output = {
    timestamp: new Date().toISOString(),
    total: results.length,
    successful: successful.length,
    results: results.sort((a, b) => (b.followers || 0) - (a.followers || 0))
  };
  
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(output, null, 2));
}

function printSummary(results) {
  const successful = results.filter(r => r.followers !== null);
  
  console.log('\n📊 Summary:');
  console.log(`   Total profiles: ${results.length}`);
  console.log(`   Successfully scraped: ${successful.length}`);
  console.log(`   Failed: ${results.length - successful.length}`);
  
  if (successful.length > 0) {
    console.log('\n🏆 Top 25 by Followers:\n');
    
    successful
      .sort((a, b) => b.followers - a.followers)
      .slice(0, 25)
      .forEach((r, i) => {
        const rank = String(i + 1).padStart(2, ' ');
        const count = r.followers.toLocaleString().padStart(10, ' ');
        console.log(`   ${rank}. ${count}  @${r.handle} (${r.name})`);
      });
  }
  
  console.log(`\n📁 Results saved to: ${CONFIG.outputFile}`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nInterrupted! Saving progress...');
  process.exit(0);
});

main().catch(console.error);
