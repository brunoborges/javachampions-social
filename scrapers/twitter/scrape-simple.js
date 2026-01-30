#!/usr/bin/env node
/**
 * Simple Twitter Profile Scraper
 * Extracts followers count and description from Twitter profile pages
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const INPUT_FILE = path.join(__dirname, '../../java-champions.yml');
const OUTPUT_FILE = path.join(__dirname, 'data.json');
const DELAY_MS = 2000; // Delay between requests to avoid rate limiting

async function extractTwitterHandles() {
  const content = fs.readFileSync(INPUT_FILE, 'utf8');
  const data = yaml.parse(content);
  
  const handles = [];
  for (const member of data.members) {
    if (member.social?.twitter) {
      const url = member.social.twitter;
      // Extract handle from URL like https://twitter.com/brunoborges
      const match = url.match(/twitter\.com\/([^\/\?]+)/i) || url.match(/x\.com\/([^\/\?]+)/i);
      if (match) {
        handles.push({
          name: member.name,
          handle: match[1]
        });
      }
    }
  }
  return handles;
}

async function scrapeProfile(page, handle) {
  const url = `https://twitter.com/${handle}`;
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Try to extract followers count
    let followers = null;
    let description = null;
    
    // Method 1: Look for followers link with count
    const followersSelectors = [
      `a[href="/${handle}/verified_followers"]`,
      `a[href="/${handle}/followers"]`,
      '[data-testid="UserProfileHeader_Items"]'
    ];
    
    for (const selector of followersSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          const match = text.match(/([\d.,]+[KMB]?)\s*(Followers|followers)/i);
          if (match) {
            followers = match[1];
            break;
          }
        }
      } catch (e) {}
    }
    
    // Fallback: search entire page for followers pattern
    if (!followers) {
      const pageContent = await page.content();
      const match = pageContent.match(/"followers_count":(\d+)/);
      if (match) {
        followers = parseInt(match[1]).toLocaleString();
      }
    }
    
    // Extract description/bio
    const descriptionSelectors = [
      '[data-testid="UserDescription"]',
      '[data-testid="UserBio"]'
    ];
    
    for (const selector of descriptionSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          description = await element.textContent();
          break;
        }
      } catch (e) {}
    }
    
    return {
      handle,
      followers,
      description,
      scraped_at: new Date().toISOString(),
      error: null
    };
    
  } catch (error) {
    return {
      handle,
      followers: null,
      description: null,
      scraped_at: new Date().toISOString(),
      error: error.message
    };
  }
}

async function main() {
  console.log('🐦 Simple Twitter Profile Scraper');
  console.log('================================\n');
  
  // Extract Twitter handles from java-champions.yml
  const handles = await extractTwitterHandles();
  console.log(`Found ${handles.length} Twitter accounts to scrape\n`);
  
  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  
  const results = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < handles.length; i++) {
    const { name, handle } = handles[i];
    console.log(`[${i + 1}/${handles.length}] Scraping @${handle} (${name})...`);
    
    const result = await scrapeProfile(page, handle);
    result.name = name;
    results.push(result);
    
    if (result.error) {
      console.log(`  ❌ Error: ${result.error}`);
      errorCount++;
    } else {
      console.log(`  ✓ Followers: ${result.followers || 'N/A'}`);
      successCount++;
    }
    
    // Delay between requests
    if (i < handles.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
  
  await browser.close();
  
  // Save results
  const output = {
    scraped_at: new Date().toISOString(),
    total: results.length,
    success: successCount,
    errors: errorCount,
    profiles: results
  };
  
  fs.writeFileSync(OUTPUT_FILE, yaml.stringify(output));
  console.log(`\n✅ Results saved to ${OUTPUT_FILE}`);
  console.log(`   Success: ${successCount}, Errors: ${errorCount}`);
}

main().catch(console.error);
