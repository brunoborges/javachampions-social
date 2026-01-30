const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Configuration
const CONFIG = {
  propertiesFile: path.join(__dirname, '../../twitter.properties'),
  yamlUrl: 'https://raw.githubusercontent.com/aalmiray/java-champions/refs/heads/main/java-champions.yml',
  outputFile: path.join(__dirname, 'data.json'),
  tweetsPerUser: 5,
  rateLimitDelay: 2000, // 2 seconds between requests
  batchSize: 100, // Batch usernames lookup (max 100 per request)
};

// Load API credentials from properties file
function loadCredentials() {
  const content = fs.readFileSync(CONFIG.propertiesFile, 'utf-8');
  const props = {};
  content.split('\n').forEach(line => {
    const [key, value] = line.split('=').map(s => s.trim());
    if (key && value) props[key] = value;
  });
  return props;
}

// Extract Twitter handles from YAML
async function getTwitterHandles() {
  console.log('📥 Fetching Java Champions YAML...');
  
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
  
  console.log(`   Found ${handles.length} Twitter handles\n`);
  return handles;
}

// Sleep helper
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Fetch user profile
async function fetchUserProfile(client, username) {
  try {
    const user = await client.v2.userByUsername(username, {
      'user.fields': [
        'id', 'name', 'username', 'description', 'profile_image_url',
        'public_metrics', 'verified', 'created_at', 'location', 'url'
      ]
    });
    
    if (user.errors?.length > 0) {
      return { error: user.errors[0].detail || 'User not found' };
    }
    
    return user.data || { error: 'No data returned' };
  } catch (error) {
    if (error.code === 429) {
      throw error; // Re-throw rate limit errors
    }
    return { error: error.message };
  }
}

// Fetch multiple user profiles at once (up to 100)
async function fetchUserProfiles(client, usernames) {
  try {
    const users = await client.v2.usersByUsernames(usernames, {
      'user.fields': [
        'id', 'name', 'username', 'description', 'profile_image_url',
        'public_metrics', 'verified', 'created_at', 'location', 'url'
      ]
    });
    
    const results = {};
    
    // Process successful lookups
    if (users.data) {
      for (const user of users.data) {
        results[user.username.toLowerCase()] = user;
      }
    }
    
    // Process errors (user not found, suspended, etc.)
    if (users.errors) {
      for (const error of users.errors) {
        // Try to extract username from error
        const match = error.value?.toLowerCase();
        if (match) {
          results[match] = { error: error.detail || error.title };
        }
      }
    }
    
    return results;
  } catch (error) {
    if (error.code === 429) {
      throw error;
    }
    throw error;
  }
}

// Fetch user's recent tweets
async function fetchUserTweets(client, userId, count = 5) {
  try {
    const tweets = await client.v2.userTimeline(userId, {
      max_results: Math.min(count, 100),
      'tweet.fields': ['created_at', 'public_metrics', 'text'],
      exclude: ['retweets', 'replies']
    });
    
    return tweets.data?.data || [];
  } catch (error) {
    if (error.code === 429) {
      throw error;
    }
    return [];
  }
}

// Handle rate limiting
async function handleRateLimit(error) {
  const resetTime = error.rateLimit?.reset;
  if (resetTime) {
    const waitMs = (resetTime * 1000) - Date.now() + 1000;
    const waitMins = Math.ceil(waitMs / 60000);
    console.log(`\n⏳ Rate limited. Waiting ${waitMins} minutes until ${new Date(resetTime * 1000).toLocaleTimeString()}...`);
    await sleep(waitMs);
  } else {
    console.log('\n⏳ Rate limited. Waiting 15 minutes...');
    await sleep(15 * 60 * 1000);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Twitter API v2 Scraper for Java Champions                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Load credentials
  console.log('🔑 Loading API credentials...');
  const creds = loadCredentials();
  
  if (!creds.key || !creds.secret) {
    console.error('❌ Missing key or secret in twitter.properties');
    process.exit(1);
  }
  
  // Initialize client with app-only auth
  console.log('🔐 Authenticating with Twitter API...');
  const appOnlyClient = new TwitterApi({
    appKey: creds.key,
    appSecret: creds.secret,
  });
  
  let client;
  try {
    client = await appOnlyClient.appLogin();
    console.log('   ✓ Authentication successful\n');
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    process.exit(1);
  }

  // Get handles
  const handles = await getTwitterHandles();
  
  // Load existing results to resume
  let results = [];
  let processedHandles = new Set();
  
  if (fs.existsSync(CONFIG.outputFile)) {
    try {
      const existing = JSON.parse(fs.readFileSync(CONFIG.outputFile, 'utf-8'));
      results = existing.results || [];
      processedHandles = new Set(results.map(r => r.handle.toLowerCase()));
      console.log(`📂 Resuming: ${results.length} already processed\n`);
    } catch (e) {
      console.log('📂 Starting fresh...\n');
    }
  }
  
  const remaining = handles.filter(h => !processedHandles.has(h.handle.toLowerCase()));
  console.log(`📋 Remaining to process: ${remaining.length}\n`);
  
  if (remaining.length === 0) {
    printSummary(results);
    return;
  }
  
  // Check for --with-tweets flag
  const fetchTweets = process.argv.includes('--with-tweets');
  if (fetchTweets) {
    console.log('📝 Will fetch recent tweets (this uses more API quota)\n');
  } else {
    console.log('💡 Run with --with-tweets to also fetch recent tweets\n');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Process in batches of 100 (max for usersByUsernames)
  const handleMap = new Map(remaining.map(h => [h.handle.toLowerCase(), h]));
  const batches = [];
  
  for (let i = 0; i < remaining.length; i += CONFIG.batchSize) {
    batches.push(remaining.slice(i, i + CONFIG.batchSize));
  }
  
  console.log(`📦 Processing ${batches.length} batch(es) of up to ${CONFIG.batchSize} users each\n`);
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const usernames = batch.map(h => h.handle);
    
    console.log(`\n📦 Batch ${batchIndex + 1}/${batches.length} (${usernames.length} users)`);
    
    let success = false;
    while (!success) {
      try {
        const profiles = await fetchUserProfiles(client, usernames);
        
        for (const { handle, name } of batch) {
          const profile = profiles[handle.toLowerCase()];
          
          if (!profile) {
            console.log(`❌ @${handle}: Not found in response`);
            results.push({
              handle,
              name,
              error: 'Not found in API response',
              fetched_at: new Date().toISOString()
            });
          } else if (profile.error) {
            console.log(`❌ @${handle}: ${profile.error}`);
            results.push({
              handle,
              name,
              error: profile.error,
              fetched_at: new Date().toISOString()
            });
          } else {
            const result = {
              handle,
              name,
              twitter_id: profile.id,
              display_name: profile.name,
              bio: profile.description,
              location: profile.location,
              url: profile.url,
              profile_image: profile.profile_image_url?.replace('_normal', ''),
              verified: profile.verified,
              created_at: profile.created_at,
              followers: profile.public_metrics?.followers_count,
              following: profile.public_metrics?.following_count,
              tweets_count: profile.public_metrics?.tweet_count,
              recent_tweets: [],
              fetched_at: new Date().toISOString()
            };
            
            // Optionally fetch tweets
            if (fetchTweets && profile.id) {
              try {
                await sleep(CONFIG.rateLimitDelay);
                const tweets = await fetchUserTweets(client, profile.id, CONFIG.tweetsPerUser);
                result.recent_tweets = tweets.map(t => ({
                  id: t.id,
                  text: t.text,
                  created_at: t.created_at,
                  likes: t.public_metrics?.like_count,
                  retweets: t.public_metrics?.retweet_count,
                  replies: t.public_metrics?.reply_count
                }));
              } catch (e) {
                if (e.code === 429) throw e;
                // Ignore tweet fetch errors
              }
            }
            
            results.push(result);
            const tweetInfo = fetchTweets ? `, ${result.recent_tweets.length} tweets` : '';
            console.log(`✓ @${handle}: ${result.followers?.toLocaleString() || 0} followers${tweetInfo}`);
          }
        }
        
        success = true;
        
        // Save after each batch
        saveResults(results);
        console.log(`📁 Saved progress (${results.length} total)`);
        
        await sleep(CONFIG.rateLimitDelay);
        
      } catch (error) {
        if (error.code === 429 || error.message?.includes('429')) {
          await handleRateLimit(error);
        } else {
          console.error(`❌ Batch error: ${error.message}`);
          // Mark all in batch as failed
          for (const { handle, name } of batch) {
            if (!results.find(r => r.handle.toLowerCase() === handle.toLowerCase())) {
              results.push({
                handle,
                name,
                error: error.message,
                fetched_at: new Date().toISOString()
              });
            }
          }
          success = true;
        }
      }
    }
  }
  
  // Final save
  saveResults(results);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Scraping Complete!');
  printSummary(results);
}

function saveResults(results) {
  const successful = results.filter(r => !r.error);
  
  const output = {
    timestamp: new Date().toISOString(),
    total: results.length,
    successful: successful.length,
    failed: results.length - successful.length,
    results: results.sort((a, b) => (b.followers || 0) - (a.followers || 0))
  };
  
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(output, null, 2));
}

function printSummary(results) {
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  
  console.log('\n📊 Summary:');
  console.log(`   Total profiles: ${results.length}`);
  console.log(`   Successfully fetched: ${successful.length}`);
  console.log(`   Failed: ${failed.length}`);
  
  if (successful.length > 0) {
    const totalFollowers = successful.reduce((sum, r) => sum + (r.followers || 0), 0);
    const totalTweets = successful.reduce((sum, r) => sum + (r.tweets_count || 0), 0);
    
    console.log(`\n📈 Aggregate Stats:`);
    console.log(`   Total followers: ${totalFollowers.toLocaleString()}`);
    console.log(`   Total tweets: ${totalTweets.toLocaleString()}`);
    
    console.log('\n🏆 Top 25 by Followers:\n');
    
    successful
      .sort((a, b) => (b.followers || 0) - (a.followers || 0))
      .slice(0, 25)
      .forEach((r, i) => {
        const rank = String(i + 1).padStart(2, ' ');
        const count = (r.followers || 0).toLocaleString().padStart(10, ' ');
        console.log(`   ${rank}. ${count}  @${r.handle} (${r.name})`);
      });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed profiles:');
    failed.slice(0, 10).forEach(r => {
      console.log(`   @${r.handle}: ${r.error}`);
    });
    if (failed.length > 10) {
      console.log(`   ... and ${failed.length - 10} more`);
    }
  }
  
  console.log(`\n📁 Results saved to: ${CONFIG.outputFile}`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Interrupted! Progress has been saved.');
  process.exit(0);
});

main().catch(console.error);
