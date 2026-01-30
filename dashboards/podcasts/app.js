// Format numbers with K/M suffixes
function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toLocaleString() || '0';
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Get logo URL
function getLogoUrl(logo) {
  if (!logo) return 'https://via.placeholder.com/80x80?text=🎙️';
  if (logo.startsWith('http')) return logo;
  return `https://github.com/aalmiray/java-champions/raw/refs/heads/main/${logo}`;
}

// Render a single podcast card
function renderPodcastCard(podcast) {
  const socialLinks = [];
  if (podcast.social?.twitter) {
    socialLinks.push(`<a href="${podcast.social.twitter}" target="_blank">𝕏 Twitter</a>`);
  }
  if (podcast.social?.mastodon) {
    socialLinks.push(`<a href="${podcast.social.mastodon}" target="_blank">🐘 Mastodon</a>`);
  }
  if (podcast.social?.linkedin) {
    socialLinks.push(`<a href="${podcast.social.linkedin}" target="_blank">💼 LinkedIn</a>`);
  }
  if (podcast.social?.bluesky) {
    socialLinks.push(`<a href="${podcast.social.bluesky}" target="_blank">🦋 Bluesky</a>`);
  }

  return `
    <div class="podcast-card" data-language="${podcast.language}">
      <div class="podcast-header">
        <img src="${getLogoUrl(podcast.logo)}" alt="${podcast.title}" class="podcast-logo" onerror="this.src='https://via.placeholder.com/80x80?text=🎙️'">
        <div class="podcast-info">
          <h3><a href="${podcast.url}" target="_blank">${podcast.title}</a></h3>
          <div class="podcast-meta">
            <span class="badge">${podcast.language}</span>
            ${podcast.episodeCount ? `<span>📻 ${podcast.episodeCount} episodes</span>` : ''}
          </div>
        </div>
      </div>
      
      ${podcast.description ? `<p class="podcast-description">${podcast.description}</p>` : ''}
      
      <div class="podcast-hosts">
        <strong>Hosts:</strong> ${podcast.hosts?.join(', ') || 'Unknown'}
      </div>
      
      ${podcast.latestEpisodeTitle ? `
        <div class="latest-episode">
          <div class="label">Latest Episode</div>
          <div class="title">${podcast.latestEpisodeTitle}</div>
        </div>
      ` : ''}
      
      ${socialLinks.length > 0 ? `
        <div class="social-links">
          ${socialLinks.join('')}
        </div>
      ` : ''}
    </div>
  `;
}

// Main render function
function render(data) {
  const podcasts = data.results;
  const totalEpisodes = podcasts.reduce((sum, p) => sum + (p.episodeCount || 0), 0);
  const withFeeds = podcasts.filter(p => p.feedUrl).length;
  const languages = [...new Set(podcasts.map(p => p.language))];
  const allHosts = podcasts.flatMap(p => p.hosts || []);
  const uniqueHosts = [...new Set(allHosts)];

  document.getElementById('timestamp').textContent = new Date(data.timestamp).toLocaleString();

  document.getElementById('app').innerHTML = `
    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="icon">🎙️</div>
        <div class="value">${podcasts.length}</div>
        <div class="label">Podcasts</div>
      </div>
      <div class="stat-card">
        <div class="icon">📻</div>
        <div class="value">${formatNumber(totalEpisodes)}</div>
        <div class="label">Total Episodes</div>
      </div>
      <div class="stat-card">
        <div class="icon">🎤</div>
        <div class="value">${uniqueHosts.length}</div>
        <div class="label">Unique Hosts</div>
      </div>
      <div class="stat-card">
        <div class="icon">🌍</div>
        <div class="value">${languages.length}</div>
        <div class="label">Languages</div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <input type="text" class="search-box" placeholder="Search podcasts..." id="searchInput">
      <button class="filter-btn active" data-lang="all">All</button>
      ${languages.map(lang => `<button class="filter-btn" data-lang="${lang}">${lang}</button>`).join('')}
    </div>

    <!-- Podcasts Grid -->
    <div class="podcast-grid" id="podcastGrid">
      ${podcasts.map(renderPodcastCard).join('')}
    </div>
  `;

  // Setup search and filter
  const searchInput = document.getElementById('searchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const podcastGrid = document.getElementById('podcastGrid');
  let currentLang = 'all';

  function filterPodcasts() {
    const searchTerm = searchInput.value.toLowerCase();
    const cards = podcastGrid.querySelectorAll('.podcast-card');
    
    cards.forEach(card => {
      const matchesSearch = card.textContent.toLowerCase().includes(searchTerm);
      const matchesLang = currentLang === 'all' || card.dataset.language === currentLang;
      card.style.display = matchesSearch && matchesLang ? '' : 'none';
    });
  }

  searchInput.addEventListener('input', filterPodcasts);
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLang = btn.dataset.lang;
      filterPodcasts();
    });
  });
}

// Embedded data (updated by scraper)
const embeddedData = {
  "timestamp": "2026-01-30T19:58:00.000Z",
  "count": 7,
  "results": [
    {
      "title": "airhacks.fm podcast",
      "url": "https://airhacks.fm",
      "logo": "https://airhacks.fm/images/airhacksfm.jpg",
      "language": "EN",
      "hosts": ["Adam Bien"],
      "social": {},
      "feedUrl": "https://airhacks.fm/episodes/feed.xml",
      "episodeCount": 381,
      "description": "podcast with adam bien"
    },
    {
      "title": "The Stackd Podcast",
      "url": "https://stackdpodcast.com",
      "logo": "https://pbs.twimg.com/profile_images/1247938130331627522/2KUqWYh__400x400.jpg",
      "language": "EN",
      "hosts": ["Kito Mann", "Josh Juneau", "Daniel Hinojosa", "Ian Hlavats"],
      "social": {"twitter": "https://twitter.com/stackdpodcast", "mastodon": "https://mastodon.social/@stackdpodcast"},
      "feedUrl": "https://www.pubhouse.net/podcasts/the-stackd-podcast/feed/",
      "episodeCount": 80,
      "description": "The Stackd Podcast - Pub House Network"
    },
    {
      "title": "Foojay Podcast",
      "url": "https://foojay.io/today/category/podcast/",
      "logo": "https://foojay.io/wp-content/uploads/2020/04/cropped-Favicon.png",
      "language": "EN",
      "hosts": ["Frank Delporte"],
      "social": {"twitter": "https://x.com/foojayio", "linkedin": "https://www.linkedin.com/company/foojayio/", "mastodon": "https://foojay.social/@foojay"},
      "feedUrl": "https://foojay.io/today/category/podcast/feed/",
      "episodeCount": 10,
      "description": "foojay is a place for friends of OpenJDK, a one stop shop for all things Java.",
      "latestEpisodeTitle": "Foojay Podcast #88: From Code to Stage: Organizing Conferences and Finding Your Voice as a Speaker"
    },
    {
      "title": "JFX in Action",
      "url": "https://webtechie.be/tags/jfx-in-action/",
      "logo": "https://webtechie.be/apple-touch-icon.png",
      "language": "EN",
      "hosts": ["Frank Delporte"],
      "social": {"mastodon": "https://foojay.social/@frankdelporte"},
      "feedUrl": "https://webtechie.be/tags/jfx-in-action/index.xml",
      "episodeCount": 24,
      "description": "JavaFX In Action video series by Frank Delporte",
      "latestEpisodeTitle": "JavaFX In Action #24 with Florian Enner about Robot 3D Visualizations and Charts"
    },
    {
      "title": "Happy Path Programming",
      "url": "https://happypathprogramming.com/",
      "logo": "https://d3t3ozftmdmh3i.cloudfront.net/production/podcast_uploaded_nologo400/7757384/7757384-1601046105997-bcb5fe879f7bb.jpg",
      "language": "EN",
      "hosts": ["Bruce Eckel", "James Ward"],
      "social": {"twitter": "https://twitter.com/happypathprog"},
      "feedUrl": "https://anchor.fm/2ed56aa0/podcast/rss",
      "episodeCount": null,
      "description": "No-frills discussions between Bruce Eckel and James Ward about programming, what it is, and what it should be."
    },
    {
      "title": "Les Cast Codeurs Podcast",
      "url": "https://lescastcodeurs.com/",
      "logo": "https://lescastcodeurs.com/images/default-twitter-card.png",
      "language": "FR",
      "hosts": ["Antonio Goncalves", "Arnaud Héritier", "Emmanuel Bernard", "Guillaume Laforge", "Katia Aresti"],
      "social": {"twitter": "https://twitter.com/lescastcodeurs"},
      "feedUrl": "https://lescastcodeurs.com/feed.atom",
      "episodeCount": null,
      "description": "Les Cast Codeurs est un podcast en français de, par et pour les développeurs."
    },
    {
      "title": "Devrel Radio",
      "url": "https://www.youtube.com/@devrelradio",
      "logo": "https://yt3.googleusercontent.com/o80vIboq1OSfP0HzWSlqk9FjjF0V83Y0s-_IHjj6bZIkUYq3HlzzfKPoQm5awB4pJuSqXGqZs8g=s900-c-k-c0x00ffffff-no-rj",
      "language": "EN",
      "hosts": ["Viktor Gamov", "Baruch Sadogursky"],
      "social": {"twitter": "https://x.com/devrelradio"},
      "feedUrl": "https://www.youtube.com/feeds/videos.xml?channel_id=UCazQCYpjkotqMKHg1ddj2eQ",
      "episodeCount": null,
      "description": "The podcast where we Tune In to the Heart of Developer Relations!"
    }
  ]
};

// Load data
async function loadData() {
  // Try fetching from file first
  try {
    const res = await fetch('../../scrapers/podcasts/data.json');
    if (res.ok) return res.json();
  } catch (e) {}
  
  // Fall back to embedded data
  if (embeddedData) return embeddedData;
  
  throw new Error('No data available');
}

loadData().then(render).catch(() => {
  document.getElementById('app').innerHTML = `
    <div class="card" style="text-align: center; padding: 3rem;">
      <h2>⚠️ Could not load podcast data</h2>
      <p style="color: var(--text-muted); margin-top: 1rem;">
        Run <code>npm run scrape:podcasts</code> to fetch the data first.
      </p>
    </div>
  `;
});
