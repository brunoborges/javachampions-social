const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Configuration
const CONFIG = {
  yamlUrl: 'https://raw.githubusercontent.com/aalmiray/java-champions/refs/heads/main/java-champions.yml',
  outputFile: path.join(__dirname, 'data.json'),
  batchSize: 10,
  delayBetweenRequests: 100, // ms - GitHub API is generous with rate limits
};

// Extract GitHub handles from YAML
async function getGitHubHandles() {
  console.log('📥 Fetching Java Champions YAML...');
  
  const response = await fetch(CONFIG.yamlUrl);
  const yamlText = await response.text();
  const data = yaml.parse(yamlText);
  
  const handles = [];
  
  for (const member of data.members) {
    if (member.social?.github) {
      const url = member.social.github;
      const match = url.match(/github\.com\/([^\/\?]+)/i);
      if (match) {
        handles.push({
          name: member.name,
          handle: match[1],
          url: url
        });
      }
    }
  }
  
  console.log(`   Found ${handles.length} GitHub handles\n`);
  return handles;
}

// Fetch GitHub profile using gh CLI
function fetchGitHubProfile(username) {
  try {
    const result = execSync(
      `gh api users/${username} --jq '{login, id, name, avatar_url, bio, company, location, blog, twitter_username, public_repos, public_gists, followers, following, created_at, updated_at, hireable}' 2>/dev/null`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    return JSON.parse(result);
  } catch (error) {
    return { error: error.message.includes('404') ? 'User not found' : error.message.slice(0, 100) };
  }
}

// Fetch user's top repositories
function fetchTopRepos(username, count = 5) {
  try {
    const result = execSync(
      `gh api "users/${username}/repos?sort=stars&per_page=${count}" --jq '[.[] | {name, description, language, stargazers_count, forks_count, open_issues_count, topics, updated_at}]' 2>/dev/null`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    return JSON.parse(result);
  } catch (error) {
    return [];
  }
}

// Fetch contribution stats (last year)
function fetchContributionStats(username) {
  try {
    // Get recent events to estimate activity
    const result = execSync(
      `gh api "users/${username}/events/public?per_page=100" --jq '[.[] | .type] | group_by(.) | map({type: .[0], count: length})' 2>/dev/null`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    const events = JSON.parse(result);
    return {
      recent_events: events.reduce((sum, e) => sum + e.count, 0),
      event_breakdown: events
    };
  } catch (error) {
    return { recent_events: 0, event_breakdown: [] };
  }
}

// Sleep helper
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  GitHub Profile Scraper for Java Champions                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get handles
  const handles = await getGitHubHandles();
  
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
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  let processed = 0;
  
  for (const { handle, name } of remaining) {
    // Fetch profile
    const profile = fetchGitHubProfile(handle);
    
    if (profile.error) {
      console.log(`❌ @${handle}: ${profile.error}`);
      results.push({
        handle,
        name,
        error: profile.error,
        fetched_at: new Date().toISOString()
      });
    } else {
      // Fetch top repos
      const repos = fetchTopRepos(handle, 5);
      
      // Fetch activity stats
      const activity = fetchContributionStats(handle);
      
      const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
      const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
      const languages = [...new Set(repos.map(r => r.language).filter(Boolean))];
      
      const result = {
        handle,
        name,
        github_id: profile.id,
        display_name: profile.name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        company: profile.company,
        location: profile.location,
        blog: profile.blog,
        twitter_username: profile.twitter_username,
        public_repos: profile.public_repos,
        public_gists: profile.public_gists,
        followers: profile.followers,
        following: profile.following,
        hireable: profile.hireable,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        top_repos: repos,
        top_repos_stars: totalStars,
        top_repos_forks: totalForks,
        languages: languages,
        recent_activity: activity,
        fetched_at: new Date().toISOString()
      };
      
      results.push(result);
      console.log(`✓ @${handle}: ${profile.followers} followers, ${profile.public_repos} repos, ${totalStars}⭐ top repos`);
    }
    
    processed++;
    
    // Save every batch
    if (processed % CONFIG.batchSize === 0) {
      saveResults(results);
      console.log(`\n📁 Saved progress (${results.length} total)\n`);
    }
    
    await sleep(CONFIG.delayBetweenRequests);
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
    const totalRepos = successful.reduce((sum, r) => sum + (r.public_repos || 0), 0);
    const totalStars = successful.reduce((sum, r) => sum + (r.top_repos_stars || 0), 0);
    
    console.log(`\n📈 Aggregate Stats:`);
    console.log(`   Total followers: ${totalFollowers.toLocaleString()}`);
    console.log(`   Total public repos: ${totalRepos.toLocaleString()}`);
    console.log(`   Stars (top 5 repos each): ${totalStars.toLocaleString()}`);
    
    console.log('\n🏆 Top 25 by Followers:\n');
    
    successful
      .sort((a, b) => (b.followers || 0) - (a.followers || 0))
      .slice(0, 25)
      .forEach((r, i) => {
        const rank = String(i + 1).padStart(2, ' ');
        const count = (r.followers || 0).toLocaleString().padStart(8, ' ');
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
