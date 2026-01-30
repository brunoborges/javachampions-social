    function formatNumber(num) {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return num?.toLocaleString() || '0';
    }

    function getAvatar(url) {
      return url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
    }

    // Language colors (subset)
    const langColors = {
      'Java': '#b07219', 'Kotlin': '#A97BFF', 'JavaScript': '#f1e05a', 'TypeScript': '#3178c6',
      'Python': '#3572A5', 'Go': '#00ADD8', 'Rust': '#dea584', 'C': '#555555', 'C++': '#f34b7d',
      'C#': '#178600', 'Ruby': '#701516', 'PHP': '#4F5D95', 'Swift': '#F05138', 'Scala': '#c22d40',
      'Groovy': '#4298b8', 'Shell': '#89e051', 'HTML': '#e34c26', 'CSS': '#563d7c', 'SCSS': '#c6538c',
      'Dockerfile': '#384d54', 'Makefile': '#427819', 'Jupyter Notebook': '#DA5B0B'
    };

    function getLangColor(lang) {
      return langColors[lang] || '#8b949e';
    }

    // Group by company
    function groupByCompany(champions) {
      const companies = {};
      champions.forEach(c => {
        if (!c.company) return;
        let name = c.company.trim().replace(/^@/, '');
        if (name.length < 2) return;
        companies[name] = (companies[name] || 0) + 1;
      });
      return Object.entries(companies).sort((a, b) => b[1] - a[1]).slice(0, 15);
    }

    // Group by language
    function groupByLanguage(champions) {
      const langs = {};
      champions.forEach(c => {
        (c.languages || []).forEach(lang => {
          if (lang) langs[lang] = (langs[lang] || 0) + 1;
        });
      });
      return Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 12);
    }

    // Follower distribution
    function getFollowerDistribution(champions) {
      const buckets = { '< 100': 0, '100-500': 0, '500-1K': 0, '1K-2K': 0, '2K+': 0 };
      champions.forEach(c => {
        const f = c.followers || 0;
        if (f < 100) buckets['< 100']++;
        else if (f < 500) buckets['100-500']++;
        else if (f < 1000) buckets['500-1K']++;
        else if (f < 2000) buckets['1K-2K']++;
        else buckets['2K+']++;
      });
      return buckets;
    }

    function render(data) {
      const champions = data.results.filter(r => !r.error);
      const totalFollowers = champions.reduce((sum, c) => sum + (c.followers || 0), 0);
      const totalRepos = champions.reduce((sum, c) => sum + (c.public_repos || 0), 0);
      const totalStars = champions.reduce((sum, c) => sum + (c.top_repos_stars || 0), 0);
      const avgFollowers = Math.round(totalFollowers / champions.length);

      const topByFollowers = [...champions].sort((a, b) => (b.followers || 0) - (a.followers || 0));
      const topByRepos = [...champions].sort((a, b) => (b.public_repos || 0) - (a.public_repos || 0));
      const topByStars = [...champions].sort((a, b) => (b.top_repos_stars || 0) - (a.top_repos_stars || 0));
      
      const languages = groupByLanguage(champions);
      const companies = groupByCompany(champions);
      const distribution = getFollowerDistribution(champions);
      const maxLangCount = languages.length > 0 ? languages[0][1] : 1;

      document.getElementById('timestamp').textContent = new Date(data.timestamp).toLocaleString();

      document.getElementById('app').innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="icon">👥</div>
            <div class="value">${champions.length}</div>
            <div class="label">Champions on GitHub</div>
          </div>
          <div class="stat-card">
            <div class="icon">👀</div>
            <div class="value">${formatNumber(totalFollowers)}</div>
            <div class="label">Total Followers</div>
          </div>
          <div class="stat-card">
            <div class="icon">📦</div>
            <div class="value">${formatNumber(totalRepos)}</div>
            <div class="label">Public Repos</div>
          </div>
          <div class="stat-card">
            <div class="icon">⭐</div>
            <div class="value">${formatNumber(totalStars)}</div>
            <div class="label">Stars (Top Repos)</div>
          </div>
          <div class="stat-card">
            <div class="icon">📊</div>
            <div class="value">${formatNumber(avgFollowers)}</div>
            <div class="label">Avg Followers</div>
          </div>
        </div>

        <div class="insights-row">
          <div class="insight-card">
            <h3>🏆 Most Followed</h3>
            <div class="value">@${topByFollowers[0]?.handle}</div>
            <div class="subtext">${formatNumber(topByFollowers[0]?.followers)} followers</div>
          </div>
          <div class="insight-card">
            <h3>📦 Most Repos</h3>
            <div class="value">@${topByRepos[0]?.handle}</div>
            <div class="subtext">${formatNumber(topByRepos[0]?.public_repos)} repositories</div>
          </div>
          <div class="insight-card">
            <h3>⭐ Most Starred</h3>
            <div class="value">@${topByStars[0]?.handle}</div>
            <div class="subtext">${formatNumber(topByStars[0]?.top_repos_stars)} stars in top repos</div>
          </div>
        </div>

        <div class="grid-3">
          <div class="card">
            <h2>👥 Top by Followers</h2>
            <div class="leaderboard">
              ${topByFollowers.slice(0, 20).map((c, i) => `
                <div class="leaderboard-item" onclick="window.open('https://github.com/${c.handle}', '_blank')">
                  <div class="rank">${i + 1}</div>
                  <img class="avatar" src="${getAvatar(c.avatar_url)}" alt="${c.name}">
                  <div class="info">
                    <div class="name">${c.display_name || c.name}</div>
                    <div class="handle">@${c.handle}</div>
                  </div>
                  <div class="stat">${formatNumber(c.followers)}<small>followers</small></div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card">
            <h2>📦 Top by Repos</h2>
            <div class="leaderboard">
              ${topByRepos.slice(0, 20).map((c, i) => `
                <div class="leaderboard-item" onclick="window.open('https://github.com/${c.handle}', '_blank')">
                  <div class="rank">${i + 1}</div>
                  <img class="avatar" src="${getAvatar(c.avatar_url)}" alt="${c.name}">
                  <div class="info">
                    <div class="name">${c.display_name || c.name}</div>
                    <div class="handle">@${c.handle}</div>
                  </div>
                  <div class="stat">${formatNumber(c.public_repos)}<small>repos</small></div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card">
            <h2>⭐ Top by Stars</h2>
            <div class="leaderboard">
              ${topByStars.slice(0, 20).map((c, i) => `
                <div class="leaderboard-item" onclick="window.open('https://github.com/${c.handle}', '_blank')">
                  <div class="rank">${i + 1}</div>
                  <img class="avatar" src="${getAvatar(c.avatar_url)}" alt="${c.name}">
                  <div class="info">
                    <div class="name">${c.display_name || c.name}</div>
                    <div class="handle">@${c.handle}</div>
                  </div>
                  <div class="stat">${formatNumber(c.top_repos_stars)}<small>stars</small></div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="grid-3">
          <div class="card">
            <h2>💻 Languages Used</h2>
            <div class="lang-list">
              ${languages.map(([lang, count]) => `
                <div class="lang-item">
                  <div class="dot" style="background: ${getLangColor(lang)}"></div>
                  <div class="name">${lang}</div>
                  <div class="count">${count}</div>
                </div>
                <div class="bar-bg"><div class="bar-fill" style="width: ${(count / maxLangCount) * 100}%; background: ${getLangColor(lang)}"></div></div>
              `).join('')}
            </div>
          </div>

          <div class="card">
            <h2>🏢 Companies</h2>
            <div class="company-list">
              ${companies.map(([company, count]) => `
                <div class="company-item">
                  <span>${company}</span>
                  <strong>${count}</strong>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card">
            <h2>📊 Follower Distribution</h2>
            <div class="chart-container">
              <canvas id="distributionChart"></canvas>
            </div>
          </div>
        </div>

        <div class="card" style="margin-bottom: 2rem;">
          <h2>🌟 All Java Champions on GitHub</h2>
          <input type="text" class="search-box" id="searchBox" placeholder="🔍 Search by name, handle, company, or bio...">
          <div class="champions-grid" id="championsGrid">
            ${topByFollowers.map(c => `
              <div class="champion-card" data-search="${(c.name + ' ' + c.handle + ' ' + (c.bio || '') + ' ' + (c.company || '')).toLowerCase()}" onclick="window.open('https://github.com/${c.handle}', '_blank')">
                <img class="avatar" src="${getAvatar(c.avatar_url)}" alt="${c.name}">
                <div class="details">
                  <div class="name">${c.display_name || c.name}</div>
                  <div class="handle">@${c.handle}</div>
                  <div class="bio">${c.bio || ''}</div>
                  <div class="stats-row">
                    <span><strong>${formatNumber(c.followers)}</strong> followers</span>
                    <span><strong>${formatNumber(c.public_repos)}</strong> repos</span>
                    <span><strong>${formatNumber(c.top_repos_stars)}</strong> ⭐</span>
                  </div>
                  ${c.languages?.length ? `
                    <div class="language-tags">
                      ${c.languages.slice(0, 4).map(l => `<span class="language-tag">${l}</span>`).join('')}
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      // Render chart
      const ctx = document.getElementById('distributionChart').getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(distribution),
          datasets: [{
            data: Object.values(distribution),
            backgroundColor: ['#238636', '#2ea043', '#3fb950', '#56d364', '#7ee787'],
            borderColor: '#161b22',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: '#8b949e', padding: 12, font: { size: 11 } } }
          }
        }
      });

      // Search
      document.getElementById('searchBox').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.champion-card').forEach(card => {
          card.style.display = card.dataset.search.includes(query) ? '' : 'none';
        });
      });
    }

    // Embedded data placeholder
    const embeddedData = {
  "timestamp": "2026-01-30T16:24:44.766Z",
  "total": 83,
  "successful": 83,
  "failed": 0,
  "results": [
    {
      "handle": "loiane",
      "name": "Loiane Groner",
      "github_id": 59545,
      "display_name": "Loiane Groner",
      "avatar_url": "https://avatars.githubusercontent.com/u/59545?v=4",
      "bio": "Software Engineer. Tech articles (loiane.com) and free video courses (loiane.training and Youtube).",
      "company": "https://loiane.training",
      "location": "Florida, US",
      "blog": "https://loiane.com",
      "twitter_username": "loiane",
      "public_repos": 220,
      "public_gists": 33,
      "followers": 19529,
      "following": 150,
      "hireable": null,
      "created_at": "2009-03-03T00:17:04Z",
      "updated_at": "2026-01-01T17:31:14Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 1,
          "language": "TypeScript",
          "name": "angular-spring-rag",
          "open_issues_count": 0,
          "stargazers_count": 9,
          "topics": [],
          "updated_at": "2026-01-18T17:54:59Z"
        },
        {
          "description": null,
          "forks_count": 1,
          "language": "Java",
          "name": "ecommerce-spring-angular-microservices",
          "open_issues_count": 0,
          "stargazers_count": 7,
          "topics": [],
          "updated_at": "2025-09-19T23:26:03Z"
        },
        {
          "description": "Sample Airline AI Assistant created with Spring AI, Angular and Gemini",
          "forks_count": 2,
          "language": "Java",
          "name": "spring-ai-flight-booking",
          "open_issues_count": 8,
          "stargazers_count": 15,
          "topics": [
            "angular",
            "gemini",
            "java",
            "springai"
          ],
          "updated_at": "2026-01-25T20:00:32Z"
        },
        {
          "description": null,
          "forks_count": 2,
          "language": "TypeScript",
          "name": "angular-mfe-native-federation",
          "open_issues_count": 0,
          "stargazers_count": 6,
          "topics": [],
          "updated_at": "2025-07-11T18:56:35Z"
        },
        {
          "description": "Sample project showcasing different capabilities from Java Spring AI with an Angular frontend",
          "forks_count": 11,
          "language": "Java",
          "name": "spring-ai-angular",
          "open_issues_count": 0,
          "stargazers_count": 49,
          "topics": [],
          "updated_at": "2026-01-08T16:10:17Z"
        }
      ],
      "top_repos_stars": 86,
      "top_repos_forks": 17,
      "languages": [
        "TypeScript",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 80,
        "event_breakdown": [
          {
            "count": 1,
            "type": "CreateEvent"
          },
          {
            "count": 30,
            "type": "DeleteEvent"
          },
          {
            "count": 1,
            "type": "IssuesEvent"
          },
          {
            "count": 23,
            "type": "PullRequestEvent"
          },
          {
            "count": 25,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:31.123Z"
    },
    {
      "handle": "odrotbohm",
      "name": "Oliver Drotbohm",
      "github_id": 128577,
      "display_name": "Oliver Drotbohm",
      "avatar_url": "https://avatars.githubusercontent.com/u/128577?v=4",
      "bio": "Frameworks & Architecture in the Spring engineering team, OpenSource enthusiast, all things Java, DDD, REST, software architecture, drums & music",
      "company": "Spring Open Source Engineering",
      "location": "Dresden, Germany",
      "blog": "www.odrotbohm.de",
      "twitter_username": null,
      "public_repos": 130,
      "public_gists": 96,
      "followers": 3931,
      "following": 32,
      "hireable": null,
      "created_at": "2009-09-18T12:34:24Z",
      "updated_at": "2025-10-10T20:24:13Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "spring-reflective-binding",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-17T18:45:32Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "hello-spring-modulith-flyway",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-13T10:03:43Z"
        },
        {
          "description": "The next generation of tooling for Spring Boot, including support for Cloud Foundry manifest files, Concourse CI pipeline definitions, BOSH deployment manifests, and more... - Available for Eclipse, Visual Studio Code, and Theia",
          "forks_count": 0,
          "language": "Java",
          "name": "spring-tools",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-23T13:18:43Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "ma_problems_and_solutions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-22T13:38:19Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "aggregate-persistence",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-06-17T13:04:20Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 100,
        "event_breakdown": [
          {
            "count": 12,
            "type": "IssueCommentEvent"
          },
          {
            "count": 60,
            "type": "IssuesEvent"
          },
          {
            "count": 1,
            "type": "PullRequestEvent"
          },
          {
            "count": 1,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 1,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 22,
            "type": "PushEvent"
          },
          {
            "count": 3,
            "type": "ReleaseEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:16.741Z"
    },
    {
      "handle": "kousen",
      "name": "Dr. Kenneth Kousen",
      "github_id": 22784,
      "display_name": "Ken Kousen",
      "avatar_url": "https://avatars.githubusercontent.com/u/22784?v=4",
      "bio": "Author of \"Mockito Made Clear\", \"Kotlin Cookbook\", \"Modern Java Recipes\", \"Gradle Recipes for Android\", and \"Making Java Groovy\". Speaker on NFJS tour.",
      "company": "Kousen IT, Inc.",
      "location": "Marlborough, CT",
      "blog": "http://www.kousenit.com",
      "twitter_username": "kenkousen",
      "public_repos": 185,
      "public_gists": 10,
      "followers": 2085,
      "following": 11,
      "hireable": null,
      "created_at": "2008-09-01T19:57:14Z",
      "updated_at": "2025-07-19T06:24:06Z",
      "top_repos": [
        {
          "description": "Student question submissions for CPSC 404 Senior Seminar - Spring 2026",
          "forks_count": 31,
          "language": null,
          "name": "cpsc404-questions-spring2026",
          "open_issues_count": 2,
          "stargazers_count": 3,
          "topics": [],
          "updated_at": "2026-01-29T11:14:27Z"
        },
        {
          "description": "Demo to show how shockwaves are formed",
          "forks_count": 0,
          "language": "JavaScript",
          "name": "shockwaves",
          "open_issues_count": 0,
          "stargazers_count": 9,
          "topics": [],
          "updated_at": "2026-01-06T14:15:35Z"
        },
        {
          "description": "Training materials for a course on Gemini CLI",
          "forks_count": 7,
          "language": "JavaScript",
          "name": "gemini-training",
          "open_issues_count": 1,
          "stargazers_count": 6,
          "topics": [],
          "updated_at": "2026-01-17T19:36:49Z"
        },
        {
          "description": "Quick Ollama chat model demo",
          "forks_count": 1,
          "language": "Java",
          "name": "OllamaDemo",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-25T18:22:51Z"
        },
        {
          "description": "Game design system with AI and human players",
          "forks_count": 8,
          "language": "Java",
          "name": "assignment-6-ai-players",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-20T16:14:54Z"
        }
      ],
      "top_repos_stars": 18,
      "top_repos_forks": 47,
      "languages": [
        "JavaScript",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 85,
        "event_breakdown": [
          {
            "count": 6,
            "type": "CreateEvent"
          },
          {
            "count": 1,
            "type": "DeleteEvent"
          },
          {
            "count": 2,
            "type": "PullRequestEvent"
          },
          {
            "count": 76,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:46.867Z"
    },
    {
      "handle": "jamesward",
      "name": "James Ward",
      "github_id": 65043,
      "display_name": "James Ward",
      "avatar_url": "https://avatars.githubusercontent.com/u/65043?v=4",
      "bio": "Developer Advocate @ AWS",
      "company": "@aws",
      "location": "Crested Butte, CO, USA",
      "blog": "https://www.jamesward.com",
      "twitter_username": "_JamesWard",
      "public_repos": 754,
      "public_gists": 25,
      "followers": 1855,
      "following": 0,
      "hireable": null,
      "created_at": "2009-03-19T21:35:10Z",
      "updated_at": "2026-01-28T15:17:17Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": "Kotlin",
          "name": "spring-ai-ui",
          "open_issues_count": 0,
          "stargazers_count": 2,
          "topics": [],
          "updated_at": "2026-01-10T17:14:34Z"
        },
        {
          "description": "A ZIO-based redis client",
          "forks_count": 0,
          "language": null,
          "name": "zio-redis",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-31T00:30:27Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Kotlin",
          "name": "hello-spring-shell",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-12T18:41:35Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "spring-ai-mcp-elicitation-demo",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-13T05:07:37Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "javadocs-power",
          "open_issues_count": 0,
          "stargazers_count": 2,
          "topics": [],
          "updated_at": "2026-01-09T23:58:05Z"
        }
      ],
      "top_repos_stars": 4,
      "top_repos_forks": 0,
      "languages": [
        "Kotlin",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 98,
        "event_breakdown": [
          {
            "count": 4,
            "type": "CreateEvent"
          },
          {
            "count": 2,
            "type": "DeleteEvent"
          },
          {
            "count": 13,
            "type": "IssueCommentEvent"
          },
          {
            "count": 7,
            "type": "IssuesEvent"
          },
          {
            "count": 7,
            "type": "PullRequestEvent"
          },
          {
            "count": 1,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 3,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 59,
            "type": "PushEvent"
          },
          {
            "count": 2,
            "type": "WatchEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:39.179Z"
    },
    {
      "handle": "raphw",
      "name": "Rafael Winterhalter",
      "github_id": 4489328,
      "display_name": "Rafael Winterhalter",
      "avatar_url": "https://avatars.githubusercontent.com/u/4489328?v=4",
      "bio": "software consultant who likes static types",
      "company": "Scienta",
      "location": "Oslo, Norway",
      "blog": "http://rafael.codes",
      "twitter_username": "rafaelcodes",
      "public_repos": 67,
      "public_gists": 73,
      "followers": 1548,
      "following": 0,
      "hireable": true,
      "created_at": "2013-05-21T12:57:35Z",
      "updated_at": "2026-01-02T00:59:50Z",
      "top_repos": [
        {
          "description": "A new approach to a Java build tool.",
          "forks_count": 2,
          "language": "Java",
          "name": "jenesis",
          "open_issues_count": 0,
          "stargazers_count": 24,
          "topics": [],
          "updated_at": "2026-01-01T08:15:07Z"
        },
        {
          "description": "A plugin to upgrade classes to a newer byte code level.",
          "forks_count": 0,
          "language": "Java",
          "name": "bytecode-update-maven-plugin",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-10-22T17:27:47Z"
        },
        {
          "description": "Main Liquibase Source",
          "forks_count": 0,
          "language": "Java",
          "name": "liquibase",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-10-24T22:18:00Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "skatteprosessen-typescript-dto-translator",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-10-04T11:11:10Z"
        },
        {
          "description": "JAXB2 Maven Plugin",
          "forks_count": 0,
          "language": "Java",
          "name": "jaxb2-maven-plugin",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-12-11T10:33:05Z"
        }
      ],
      "top_repos_stars": 24,
      "top_repos_forks": 2,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 59,
        "event_breakdown": [
          {
            "count": 2,
            "type": "CreateEvent"
          },
          {
            "count": 1,
            "type": "DeleteEvent"
          },
          {
            "count": 22,
            "type": "IssueCommentEvent"
          },
          {
            "count": 5,
            "type": "IssuesEvent"
          },
          {
            "count": 5,
            "type": "PullRequestEvent"
          },
          {
            "count": 3,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 1,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 19,
            "type": "PushEvent"
          },
          {
            "count": 1,
            "type": "ReleaseEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:42.232Z"
    },
    {
      "handle": "eliasnogueira",
      "name": "Elias Nogueira",
      "github_id": 284888,
      "display_name": "Elias Nogueira",
      "avatar_url": "https://avatars.githubusercontent.com/u/284888?v=4",
      "bio": "Lead Principal Software Engineer  | Java Champion | Oracle ACE for Java",
      "company": "Booking.com",
      "location": "Amsterdam, the Netherlands",
      "blog": "https://github.com/eliasnogueira/public-speaking",
      "twitter_username": "eliasnogueira",
      "public_repos": 95,
      "public_gists": 186,
      "followers": 1366,
      "following": 54,
      "hireable": true,
      "created_at": "2010-05-23T18:41:48Z",
      "updated_at": "2026-01-27T18:17:58Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "junit-xml-report-tryout",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-24T12:08:47Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "payment-system-part-1",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-03T12:20:40Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "test-distributed-systems",
          "open_issues_count": 0,
          "stargazers_count": 5,
          "topics": [],
          "updated_at": "2026-01-26T16:51:42Z"
        },
        {
          "description": "Backup list for my friendly Java bubble",
          "forks_count": 0,
          "language": null,
          "name": "javabubble",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-03-16T18:13:47Z"
        },
        {
          "description": null,
          "forks_count": 1,
          "language": "Java",
          "name": "payment-system",
          "open_issues_count": 6,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-04-30T13:33:06Z"
        }
      ],
      "top_repos_stars": 6,
      "top_repos_forks": 1,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 60,
        "event_breakdown": [
          {
            "count": 3,
            "type": "CreateEvent"
          },
          {
            "count": 4,
            "type": "DeleteEvent"
          },
          {
            "count": 16,
            "type": "PublicEvent"
          },
          {
            "count": 17,
            "type": "PullRequestEvent"
          },
          {
            "count": 20,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:02.090Z"
    },
    {
      "handle": "mp911de",
      "name": "Mark Paluch",
      "github_id": 1035015,
      "display_name": "Mark Paluch",
      "avatar_url": "https://avatars.githubusercontent.com/u/1035015?v=4",
      "bio": "Finest hand-crafted software. Spring Data Project Lead, All Things Reactive. Open source, music, and computers.",
      "company": null,
      "location": "Ostfriesland 🌊🌬️🌞🌧️ Germany",
      "blog": "http://www.paluch.biz",
      "twitter_username": null,
      "public_repos": 94,
      "public_gists": 104,
      "followers": 1362,
      "following": 9,
      "hireable": null,
      "created_at": "2011-09-08T06:33:10Z",
      "updated_at": "2026-01-07T12:30:00Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "some-consumer",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-19T07:58:27Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "some-actions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-19T08:18:49Z"
        },
        {
          "description": "fast jpa! who would've thought?",
          "forks_count": 0,
          "language": "Java",
          "name": "2025-05-25-spring-data-jpa-aot",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-05-26T23:55:03Z"
        },
        {
          "description": "Advanced Java Redis client for thread-safe sync, async, and reactive usage. Supports Cluster, Sentinel, Pipelining, and codecs.",
          "forks_count": 0,
          "language": null,
          "name": "lettuce",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2024-12-09T19:55:01Z"
        },
        {
          "description": null,
          "forks_count": 1,
          "language": "Java",
          "name": "modern-spring-data",
          "open_issues_count": 0,
          "stargazers_count": 2,
          "topics": [],
          "updated_at": "2024-08-27T12:13:27Z"
        }
      ],
      "top_repos_stars": 4,
      "top_repos_forks": 1,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 100,
        "event_breakdown": [
          {
            "count": 2,
            "type": "DeleteEvent"
          },
          {
            "count": 1,
            "type": "GollumEvent"
          },
          {
            "count": 4,
            "type": "IssueCommentEvent"
          },
          {
            "count": 48,
            "type": "IssuesEvent"
          },
          {
            "count": 13,
            "type": "PullRequestEvent"
          },
          {
            "count": 9,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 2,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 21,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:05.021Z"
    },
    {
      "handle": "sdaschner",
      "name": "Sebastian Daschner",
      "github_id": 6815170,
      "display_name": "Sebastian Daschner",
      "avatar_url": "https://avatars.githubusercontent.com/u/6815170?v=4",
      "bio": "Helping developers solving the challenges of enterprise software. Java Champion, trainer, book author, creator of @daycaptain",
      "company": null,
      "location": "World",
      "blog": "https://sebastian-daschner.com",
      "twitter_username": "DaschnerS",
      "public_repos": 137,
      "public_gists": 2,
      "followers": 1245,
      "following": 2,
      "hireable": true,
      "created_at": "2014-02-28T11:29:49Z",
      "updated_at": "2026-01-16T07:22:23Z",
      "top_repos": [
        {
          "description": "An extended `cp`",
          "forks_count": 0,
          "language": "Rust",
          "name": "xcp",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-01-19T08:07:02Z"
        },
        {
          "description": null,
          "forks_count": 1,
          "language": "Java",
          "name": "rh-summit-spring-quarkus-migration",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-10-06T14:46:35Z"
        },
        {
          "description": "JCrete unfonference 2023 material",
          "forks_count": 0,
          "language": null,
          "name": "jcrete2023",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-07-13T18:57:00Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "blink-extension",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-01-05T06:54:10Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "testing-ws-2023-04-18",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-03-01T17:23:38Z"
        }
      ],
      "top_repos_stars": 2,
      "top_repos_forks": 1,
      "languages": [
        "Rust",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 0,
        "event_breakdown": []
      },
      "fetched_at": "2026-01-30T16:23:07.707Z"
    },
    {
      "handle": "yanaga",
      "name": "Edson Yanaga",
      "github_id": 505867,
      "display_name": "Edson Yanaga",
      "avatar_url": "https://avatars.githubusercontent.com/u/505867?v=4",
      "bio": "Empowering developers worldwide as Staff Developer Relations Engineer, Wallet Lead, @Google. Java Champion and former 7x Microsoft MVP.",
      "company": "Google",
      "location": "Raleigh/Durham Area, NC",
      "blog": "https://yanaga.io",
      "twitter_username": "yanaga",
      "public_repos": 56,
      "public_gists": 27,
      "followers": 1118,
      "following": 0,
      "hireable": true,
      "created_at": "2010-12-02T00:35:06Z",
      "updated_at": "2026-01-12T15:14:41Z",
      "top_repos": [
        {
          "description": "Google Wallet API Callback Demo",
          "forks_count": 0,
          "language": "Java",
          "name": "wallet-api-callback-demo",
          "open_issues_count": 0,
          "stargazers_count": 2,
          "topics": [],
          "updated_at": "2025-06-26T10:45:43Z"
        },
        {
          "description": "Samples for the Google Wallet REST APIs",
          "forks_count": 0,
          "language": "C#",
          "name": "rest-samples",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-10-25T19:46:32Z"
        },
        {
          "description": null,
          "forks_count": 2,
          "language": null,
          "name": "google-wallet-demo",
          "open_issues_count": 0,
          "stargazers_count": 10,
          "topics": [],
          "updated_at": "2025-09-03T19:05:14Z"
        },
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": "CSS",
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-11-29T16:50:04Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "test-repo",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-04-21T17:25:23Z"
        }
      ],
      "top_repos_stars": 12,
      "top_repos_forks": 2,
      "languages": [
        "Java",
        "C#",
        "CSS"
      ],
      "recent_activity": {
        "recent_events": 1,
        "event_breakdown": [
          {
            "count": 1,
            "type": "PublicEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:44.664Z"
    },
    {
      "handle": "nurkiewicz",
      "name": "Tomasz Nurkiewicz",
      "github_id": 164045,
      "display_name": "Tomasz Nurkiewicz",
      "avatar_url": "https://avatars.githubusercontent.com/u/164045?v=4",
      "bio": null,
      "company": "Monday.com",
      "location": "Warsaw",
      "blog": "https://nurkiewicz.com",
      "twitter_username": null,
      "public_repos": 163,
      "public_gists": 28,
      "followers": 1020,
      "following": 0,
      "hireable": null,
      "created_at": "2009-12-07T22:39:22Z",
      "updated_at": "2026-01-20T15:38:41Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": "Python",
          "name": "public-transport",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-12-06T17:18:52Z"
        },
        {
          "description": "Model Context Protocol Servers",
          "forks_count": 0,
          "language": null,
          "name": "servers",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-18T09:32:23Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "TypeScript",
          "name": "request-collapser",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-29T23:05:44Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "samples-typescript",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-01-26T10:22:17Z"
        },
        {
          "description": "Pet project to integrate Kafka and Elasticsearch in Node.js/Express.js application",
          "forks_count": 0,
          "language": "TypeScript",
          "name": "mastodon-search",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-08-04T08:02:55Z"
        }
      ],
      "top_repos_stars": 1,
      "top_repos_forks": 0,
      "languages": [
        "Python",
        "TypeScript"
      ],
      "recent_activity": {
        "recent_events": 35,
        "event_breakdown": [
          {
            "count": 35,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:03.282Z"
    },
    {
      "handle": "HanSolo",
      "name": "Gerrit Grunwald",
      "github_id": 62843,
      "display_name": "Gerrit Grunwald",
      "avatar_url": "https://avatars.githubusercontent.com/u/62843?v=4",
      "bio": "❤️ coding in general, esp. Java(FX), Swift and if needed JavaScript. UI has my love...",
      "company": "Azul Systems",
      "location": "Muenster, Germany",
      "blog": "http://www.harmonic-code.org",
      "twitter_username": "hansolo_",
      "public_repos": 194,
      "public_gists": 16,
      "followers": 1008,
      "following": 221,
      "hireable": null,
      "created_at": "2009-03-12T18:08:18Z",
      "updated_at": "2026-01-29T19:57:26Z",
      "top_repos": [
        {
          "description": "A swift app to monitor the latest versions available in the disco api and on the Adoptium Marketplace",
          "forks_count": 0,
          "language": "Swift",
          "name": "ReleaseMonitor",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-29T23:54:26Z"
        },
        {
          "description": "A little swift app that acts as a photo frame",
          "forks_count": 0,
          "language": "Swift",
          "name": "photo4You",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-13T12:00:07Z"
        },
        {
          "description": "A little iOS app that visualises your home timezone and the current timezone in a widget",
          "forks_count": 0,
          "language": null,
          "name": "Time-At-Home",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-20T12:56:17Z"
        },
        {
          "description": "JDKUpdaterFX is a tool to find updates for OpenJDK distributions installed on your machine",
          "forks_count": 0,
          "language": "Java",
          "name": "jdkupdaterfx",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-29T10:20:49Z"
        },
        {
          "description": "A little example that shows the benefit of in-production scanning with Azul AVD",
          "forks_count": 0,
          "language": "Java",
          "name": "avdexample",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-19T07:11:50Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Swift",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 33,
        "event_breakdown": [
          {
            "count": 12,
            "type": "IssueCommentEvent"
          },
          {
            "count": 7,
            "type": "IssuesEvent"
          },
          {
            "count": 13,
            "type": "PushEvent"
          },
          {
            "count": 1,
            "type": "ReleaseEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:32.466Z"
    },
    {
      "handle": "saturnism",
      "name": "Ray Tsang",
      "github_id": 1998883,
      "display_name": "Ray Tsang",
      "avatar_url": "https://avatars.githubusercontent.com/u/1998883?v=4",
      "bio": "Java Champion, Backpacker, Snowboarder, and Photographer.",
      "company": "NVIDIA",
      "location": "New York, NY",
      "blog": "https://saturnism.me",
      "twitter_username": "saturnism",
      "public_repos": 186,
      "public_gists": 12,
      "followers": 1000,
      "following": 38,
      "hireable": null,
      "created_at": "2012-07-18T14:08:46Z",
      "updated_at": "2026-01-28T12:30:53Z",
      "top_repos": [
        {
          "description": "A networking framework that evolves with your application",
          "forks_count": 0,
          "language": "Java",
          "name": "servicetalk",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2022-02-21T23:16:41Z"
        },
        {
          "description": "A browser automation framework and ecosystem.",
          "forks_count": 1,
          "language": null,
          "name": "selenium",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2021-03-01T15:56:26Z"
        },
        {
          "description": null,
          "forks_count": 3,
          "language": "Kotlin",
          "name": "photo-backend",
          "open_issues_count": 0,
          "stargazers_count": 20,
          "topics": [],
          "updated_at": "2022-07-27T11:34:11Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "choose-jhipster",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2021-01-13T19:22:24Z"
        },
        {
          "description": "Testcontainers gcloud Examples",
          "forks_count": 6,
          "language": "Java",
          "name": "testcontainers-gcloud-examples",
          "open_issues_count": 1,
          "stargazers_count": 4,
          "topics": [
            "examples",
            "gcloud",
            "google-cloud",
            "google-cloud-platform",
            "junit",
            "junit5",
            "local-development",
            "pubsub",
            "testcontainers",
            "testing"
          ],
          "updated_at": "2024-05-27T09:38:19Z"
        }
      ],
      "top_repos_stars": 24,
      "top_repos_forks": 10,
      "languages": [
        "Java",
        "Kotlin"
      ],
      "recent_activity": {
        "recent_events": 0,
        "event_breakdown": []
      },
      "fetched_at": "2026-01-30T16:24:32.209Z"
    },
    {
      "handle": "aalmiray",
      "name": "Andres Almiray",
      "github_id": 13969,
      "display_name": "Andres Almiray",
      "avatar_url": "https://avatars.githubusercontent.com/u/13969?v=4",
      "bio": "I code for fun and help others in the process. Java Champion Alumni. Co-founder of Hackergarten & Hack.Commit.Push. Creator of @jreleaser 🚀",
      "company": null,
      "location": "Basel, Switzerland",
      "blog": "https://andresalmiray.com/",
      "twitter_username": "aalmiray",
      "public_repos": 264,
      "public_gists": 173,
      "followers": 963,
      "following": 65,
      "hireable": null,
      "created_at": "2008-06-17T00:30:56Z",
      "updated_at": "2026-01-29T17:27:27Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "maven-examples",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-28T14:11:16Z"
        },
        {
          "description": "Java implementation of the Gemini Interactions API",
          "forks_count": 0,
          "language": "Java",
          "name": "gemini-interactions-api-sdk",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-05T17:46:22Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "test",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-02T02:02:44Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "helloworld-container",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-07-28T15:42:53Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "helloworld-docker",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-07-27T12:22:43Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 94,
        "event_breakdown": [
          {
            "count": 2,
            "type": "CreateEvent"
          },
          {
            "count": 9,
            "type": "DeleteEvent"
          },
          {
            "count": 1,
            "type": "DiscussionEvent"
          },
          {
            "count": 12,
            "type": "IssueCommentEvent"
          },
          {
            "count": 23,
            "type": "IssuesEvent"
          },
          {
            "count": 4,
            "type": "PullRequestEvent"
          },
          {
            "count": 5,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 6,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 31,
            "type": "PushEvent"
          },
          {
            "count": 1,
            "type": "ReleaseEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:22:53.175Z"
    },
    {
      "handle": "nipafx",
      "name": "Nicolai Parlog",
      "github_id": 6537432,
      "display_name": "Nicolai Parlog",
      "avatar_url": "https://avatars.githubusercontent.com/u/6537432?v=4",
      "bio": "Java enthusiast with a passion for learning and sharing. Java Developer Advocate at Oracle but views (and code) are my own.",
      "company": "Oracle",
      "location": "Karlsruhe, Europe",
      "blog": "https://nipafx.dev",
      "twitter_username": "nipafx",
      "public_repos": 40,
      "public_gists": 32,
      "followers": 903,
      "following": 0,
      "hireable": null,
      "created_at": "2014-01-29T18:14:31Z",
      "updated_at": "2025-12-23T09:31:40Z",
      "top_repos": [
        {
          "description": "https://openjdk.org/projects/valhalla",
          "forks_count": 0,
          "language": null,
          "name": "valhalla-docs",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2026-01-07T23:05:13Z"
        },
        {
          "description": null,
          "forks_count": 4,
          "language": "Java",
          "name": "scia",
          "open_issues_count": 0,
          "stargazers_count": 5,
          "topics": [],
          "updated_at": "2026-01-20T22:04:14Z"
        },
        {
          "description": "https://openjdk.org/projects/amber",
          "forks_count": 0,
          "language": "HTML",
          "name": "amber-docs",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2026-01-18T21:17:36Z"
        },
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": null,
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-12-02T09:37:03Z"
        },
        {
          "description": "Visualize Your Ideas With Code",
          "forks_count": 0,
          "language": null,
          "name": "motion-canvas",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-10-16T10:01:11Z"
        }
      ],
      "top_repos_stars": 7,
      "top_repos_forks": 4,
      "languages": [
        "Java",
        "HTML"
      ],
      "recent_activity": {
        "recent_events": 34,
        "event_breakdown": [
          {
            "count": 2,
            "type": "CreateEvent"
          },
          {
            "count": 1,
            "type": "ForkEvent"
          },
          {
            "count": 2,
            "type": "IssueCommentEvent"
          },
          {
            "count": 2,
            "type": "IssuesEvent"
          },
          {
            "count": 6,
            "type": "PullRequestEvent"
          },
          {
            "count": 21,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:06.740Z"
    },
    {
      "handle": "marcingrzejszczak",
      "name": "Marcin Grzejszczak",
      "github_id": 3297437,
      "display_name": "Marcin Grzejszczak",
      "avatar_url": "https://avatars.githubusercontent.com/u/3297437?v=4",
      "bio": "Marcin Grzejszczak is the ex-member of the Spring Engineering Team, working on Spring Observability, Spring Cloud Contract, Micrometer",
      "company": "HeroDevs",
      "location": "Warsaw, Poland",
      "blog": "https://toomuchcoding.com",
      "twitter_username": null,
      "public_repos": 334,
      "public_gists": 30,
      "followers": 878,
      "following": 36,
      "hireable": null,
      "created_at": "2013-01-17T15:36:19Z",
      "updated_at": "2026-01-30T00:00:24Z",
      "top_repos": [
        {
          "description": "Short lived microservices with Spring Batch",
          "forks_count": 0,
          "language": null,
          "name": "spring-cloud-task",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-29T14:51:52Z"
        },
        {
          "description": "Chaos Monkey for Spring Boot",
          "forks_count": 0,
          "language": null,
          "name": "chaos-monkey-spring-boot",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-28T09:50:41Z"
        },
        {
          "description": "Created from HugoBlox template: theme-academic-cv",
          "forks_count": 0,
          "language": "Jupyter Notebook",
          "name": "stellar-comet",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-16T16:30:48Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "scp-crossplane",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-13T18:00:21Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "jenkins-job-dsl-maven",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-08T12:36:00Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Jupyter Notebook",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 100,
        "event_breakdown": [
          {
            "count": 3,
            "type": "CreateEvent"
          },
          {
            "count": 6,
            "type": "DeleteEvent"
          },
          {
            "count": 2,
            "type": "ForkEvent"
          },
          {
            "count": 20,
            "type": "IssueCommentEvent"
          },
          {
            "count": 3,
            "type": "IssuesEvent"
          },
          {
            "count": 8,
            "type": "PullRequestEvent"
          },
          {
            "count": 6,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 8,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 44,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:35.358Z"
    },
    {
      "handle": "mminella",
      "name": "Michael T. Minella",
      "github_id": 630743,
      "display_name": "Michael Minella",
      "avatar_url": "https://avatars.githubusercontent.com/u/630743?v=4",
      "bio": "Director of the OSS Spring Team at Broadcom. Previous lead of Spring Batch and Spring Cloud Task.",
      "company": "Broadcom",
      "location": "Naperville, IL",
      "blog": "http://spring.io/authors/mminella",
      "twitter_username": "michaelminella",
      "public_repos": 197,
      "public_gists": 9,
      "followers": 843,
      "following": 11,
      "hireable": null,
      "created_at": "2011-02-21T21:30:39Z",
      "updated_at": "2026-01-28T15:04:27Z",
      "top_repos": [
        {
          "description": "Autonomous CLI agent integrations for the Spring AI ecosystem with Claude Code, Gemini CLI, and secure sandbox execution",
          "forks_count": 0,
          "language": null,
          "name": "spring-ai-agents",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-23T14:56:25Z"
        },
        {
          "description": "The Alpha_Human_gym repository contains all the code for the Alpha-Human-H1 robot, including the code for nano, odroid, and stm32 boards.",
          "forks_count": 0,
          "language": null,
          "name": "Alpha_Human_gym",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-24T00:11:44Z"
        },
        {
          "description": "Spring Security",
          "forks_count": 1,
          "language": null,
          "name": "spring-security",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-06-29T17:39:34Z"
        },
        {
          "description": "Common build concerns, shared plugin configuration, etc. for Spring Cloud modules",
          "forks_count": 0,
          "language": null,
          "name": "spring-cloud-build",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-06-23T15:13:42Z"
        },
        {
          "description": "Common classes used in different Spring Cloud implementations",
          "forks_count": 0,
          "language": null,
          "name": "spring-cloud-commons",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-06-19T20:46:46Z"
        }
      ],
      "top_repos_stars": 1,
      "top_repos_forks": 1,
      "languages": [],
      "recent_activity": {
        "recent_events": 0,
        "event_breakdown": []
      },
      "fetched_at": "2026-01-30T16:23:59.566Z"
    },
    {
      "handle": "jodastephen",
      "name": "Stephen Colebourne",
      "github_id": 213212,
      "display_name": "Stephen Colebourne",
      "avatar_url": "https://avatars.githubusercontent.com/u/213212?v=4",
      "bio": "Java Champion, known for java.time.*, Joda and ThreeTen",
      "company": null,
      "location": "London, UK",
      "blog": "http://blog.joda.org",
      "twitter_username": "jodastephen",
      "public_repos": 35,
      "public_gists": 31,
      "followers": 765,
      "following": 0,
      "hireable": null,
      "created_at": "2010-03-01T15:50:50Z",
      "updated_at": "2025-12-15T07:54:14Z",
      "top_repos": [
        {
          "description": "✅ The programmer-friendly testing framework for Java and the JVM",
          "forks_count": 0,
          "language": null,
          "name": "junit-framework",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-30T22:00:15Z"
        },
        {
          "description": "Proposals for the Java language",
          "forks_count": 0,
          "language": null,
          "name": "java-proposals",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-11-06T20:09:35Z"
        },
        {
          "description": "A unique string ID generator for Java.",
          "forks_count": 0,
          "language": null,
          "name": "jnanoid",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2024-03-21T01:09:36Z"
        },
        {
          "description": "JDK main-line development",
          "forks_count": 0,
          "language": null,
          "name": "jdk",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2021-05-10T19:53:34Z"
        },
        {
          "description": "Intellij Plugin to convert from TestNG to JUnit 5 and AssertJ",
          "forks_count": 0,
          "language": "Kotlin",
          "name": "Assertions2AssertJ",
          "open_issues_count": 0,
          "stargazers_count": 4,
          "topics": [],
          "updated_at": "2019-09-23T20:09:12Z"
        }
      ],
      "top_repos_stars": 6,
      "top_repos_forks": 0,
      "languages": [
        "Kotlin"
      ],
      "recent_activity": {
        "recent_events": 14,
        "event_breakdown": [
          {
            "count": 2,
            "type": "CreateEvent"
          },
          {
            "count": 1,
            "type": "DeleteEvent"
          },
          {
            "count": 1,
            "type": "IssueCommentEvent"
          },
          {
            "count": 4,
            "type": "IssuesEvent"
          },
          {
            "count": 3,
            "type": "PullRequestEvent"
          },
          {
            "count": 3,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:04.280Z"
    },
    {
      "handle": "deepu105",
      "name": "Deepu K Sasidharan",
      "github_id": 1107223,
      "display_name": "Deepu K Sasidharan",
      "avatar_url": "https://avatars.githubusercontent.com/u/1107223?v=4",
      "bio": "@jhipster co-lead, Creator of @kdash-rs, Java Champion, Developer Advocate, Writer, Speaker, Polyglot dev. Java, Rust, DevOps\r\n\r\nhttps://deepu.tech",
      "company": "@okta",
      "location": "Netherlands",
      "blog": "https://mastodon.social/@deepu105",
      "twitter_username": "deepu105",
      "public_repos": 162,
      "public_gists": 33,
      "followers": 746,
      "following": 8,
      "hireable": true,
      "created_at": "2011-10-06T10:55:51Z",
      "updated_at": "2026-01-08T12:26:28Z",
      "top_repos": [
        {
          "description": "HA integration for go-eCharger series & go-eController communicate via the HTTP API v2.0. Please note, that this integration is not official and not supported by the go-e developer team. This project is not affiliated with go-e.com in any way.",
          "forks_count": 0,
          "language": null,
          "name": "ha-goecharger-api2",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-08T13:56:18Z"
        },
        {
          "description": "The 500 AI Agents Projects is a curated collection of AI agent use cases across various industries. It showcases practical applications and provides links to open-source projects for implementation, illustrating how AI agents are transforming sectors such as healthcare, finance, education, retail, and more.",
          "forks_count": 0,
          "language": null,
          "name": "500-AI-Agents-Projects",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-31T07:16:16Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "TypeScript",
          "name": "auth0-fastmcp-demo",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-28T14:02:01Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "auth0-mcp-server",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-25T12:32:04Z"
        },
        {
          "description": "My EWW widgets config.",
          "forks_count": 0,
          "language": null,
          "name": "eww",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-08-17T17:11:51Z"
        }
      ],
      "top_repos_stars": 1,
      "top_repos_forks": 0,
      "languages": [
        "TypeScript"
      ],
      "recent_activity": {
        "recent_events": 1,
        "event_breakdown": [
          {
            "count": 1,
            "type": "ForkEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:18.091Z"
    },
    {
      "handle": "amaembo",
      "name": "Tagir Valeev",
      "github_id": 5114450,
      "display_name": "Tagir Valeev",
      "avatar_url": "https://avatars.githubusercontent.com/u/5114450?v=4",
      "bio": "Check my book „100 Java Mistakes”: https://mng.bz/Alvg",
      "company": null,
      "location": "Munich, Germany",
      "blog": "https://mng.bz/Alvg",
      "twitter_username": "tagir_valeev",
      "public_repos": 36,
      "public_gists": 67,
      "followers": 739,
      "following": 1,
      "hireable": null,
      "created_at": "2013-07-29T16:04:31Z",
      "updated_at": "2026-01-27T21:02:11Z",
      "top_repos": [
        {
          "description": "✅ The 5th major version of the programmer-friendly testing framework for Java and the JVM",
          "forks_count": 0,
          "language": null,
          "name": "junit5",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-09-25T06:36:30Z"
        },
        {
          "description": "Experimental assertions library based on Project Babylon features",
          "forks_count": 0,
          "language": "Java",
          "name": "code-reflection-asserts",
          "open_issues_count": 0,
          "stargazers_count": 9,
          "topics": [],
          "updated_at": "2025-03-19T06:45:53Z"
        },
        {
          "description": null,
          "forks_count": 9,
          "language": "Java",
          "name": "100_java_mistakes_appendix",
          "open_issues_count": 0,
          "stargazers_count": 11,
          "topics": [],
          "updated_at": "2025-09-09T11:26:22Z"
        },
        {
          "description": "Highly-available version-controlled service configuration repository based on Git, ZooKeeper and HTTP/2",
          "forks_count": 0,
          "language": null,
          "name": "centraldogma",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2022-11-09T01:39:58Z"
        },
        {
          "description": "Generate diagrams from textual description",
          "forks_count": 0,
          "language": null,
          "name": "plantuml",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2022-10-28T06:19:42Z"
        }
      ],
      "top_repos_stars": 20,
      "top_repos_forks": 9,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 4,
        "event_breakdown": [
          {
            "count": 1,
            "type": "IssueCommentEvent"
          },
          {
            "count": 1,
            "type": "PullRequestEvent"
          },
          {
            "count": 1,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 1,
            "type": "PullRequestReviewEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:33.554Z"
    },
    {
      "handle": "eldermoraes",
      "name": "Elder Moraes",
      "github_id": 13017335,
      "display_name": "Elder Moraes",
      "avatar_url": "https://avatars.githubusercontent.com/u/13017335?v=4",
      "bio": "I help Java developers to build and deliver high-performance and highly available backend applications, so they can work on the top projects of the industry.",
      "company": null,
      "location": "São Paulo/Brazil",
      "blog": "eldermoraes.com",
      "twitter_username": "elderjava",
      "public_repos": 76,
      "public_gists": 50,
      "followers": 671,
      "following": 26,
      "hireable": null,
      "created_at": "2015-06-23T12:47:07Z",
      "updated_at": "2024-07-17T19:12:21Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "demo-logs-ia",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-26T02:15:37Z"
        },
        {
          "description": "Quarkus Langchain4J Workshop",
          "forks_count": 0,
          "language": "Java",
          "name": "quarkus-workshop-langchain4j",
          "open_issues_count": 0,
          "stargazers_count": 4,
          "topics": [],
          "updated_at": "2025-11-20T20:06:22Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "HTML",
          "name": "enterprise-ai-java-langchain4j",
          "open_issues_count": 0,
          "stargazers_count": 5,
          "topics": [],
          "updated_at": "2026-01-30T02:49:14Z"
        },
        {
          "description": null,
          "forks_count": 1,
          "language": "HTML",
          "name": "local-ai-knowledge-base",
          "open_issues_count": 0,
          "stargazers_count": 2,
          "topics": [],
          "updated_at": "2025-09-04T15:32:42Z"
        },
        {
          "description": null,
          "forks_count": 1,
          "language": "Java",
          "name": "demo-vt-lc4j",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-09-19T12:55:07Z"
        }
      ],
      "top_repos_stars": 12,
      "top_repos_forks": 2,
      "languages": [
        "Java",
        "HTML"
      ],
      "recent_activity": {
        "recent_events": 2,
        "event_breakdown": [
          {
            "count": 1,
            "type": "PushEvent"
          },
          {
            "count": 1,
            "type": "WatchEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:00.754Z"
    },
    {
      "handle": "pivovarit",
      "name": "Grzegorz Piwowarek",
      "github_id": 2182533,
      "display_name": "Grzegorz Piwowarek",
      "avatar_url": "https://avatars.githubusercontent.com/u/2182533?v=4",
      "bio": "Your friendly neighbourhood software weaver",
      "company": "@vavr-io",
      "location": "Warsaw",
      "blog": "https://4comprehension.com",
      "twitter_username": "pivovarit",
      "public_repos": 46,
      "public_gists": 4,
      "followers": 640,
      "following": 100,
      "hireable": true,
      "created_at": "2012-08-20T10:01:49Z",
      "updated_at": "2026-01-24T08:34:51Z",
      "top_repos": [
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": null,
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2026-01-15T07:42:39Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "verify-jar-action",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-12T20:02:25Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "java-library-template",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-11T07:17:52Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "for-comprehension4j",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2026-01-28T05:17:12Z"
        },
        {
          "description": "Distributed lock for your scheduled tasks",
          "forks_count": 0,
          "language": null,
          "name": "ShedLock",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-26T20:22:05Z"
        }
      ],
      "top_repos_stars": 2,
      "top_repos_forks": 0,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 100,
        "event_breakdown": [
          {
            "count": 4,
            "type": "CreateEvent"
          },
          {
            "count": 20,
            "type": "DeleteEvent"
          },
          {
            "count": 9,
            "type": "PullRequestEvent"
          },
          {
            "count": 9,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 58,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:08.260Z"
    },
    {
      "handle": "rokon12",
      "name": "A N M *Bazlur* Rahman",
      "github_id": 429073,
      "display_name": "A N M Bazlur Rahman ",
      "avatar_url": "https://avatars.githubusercontent.com/u/429073?v=4",
      "bio": "Java Champion 🏆 Empowering Developers through Speaking 🗣️ Writing ✍️ Mentoring 🤝 & Community Building 🌍 Published Author 📖 Contributing Editor at InfoQ and",
      "company": "Hammerspace",
      "location": "Toronto, Canada",
      "blog": "https://bazlur.ca",
      "twitter_username": "bazlur_rahman",
      "public_repos": 292,
      "public_gists": 166,
      "followers": 635,
      "following": 24,
      "hireable": true,
      "created_at": "2010-10-06T04:55:44Z",
      "updated_at": "2026-01-18T12:47:57Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "hive",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2026-01-02T03:15:09Z"
        },
        {
          "description": "Easy to use, very low overhead, Java APM",
          "forks_count": 0,
          "language": null,
          "name": "glowroot",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-10T05:29:49Z"
        },
        {
          "description": null,
          "forks_count": 2,
          "language": "Java",
          "name": "throttle-craft",
          "open_issues_count": 0,
          "stargazers_count": 3,
          "topics": [],
          "updated_at": "2025-11-24T14:40:29Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "langchain4j-examples",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-05T22:08:46Z"
        },
        {
          "description": "A simple, elegant task pipeline library, with zero dependencies! Whether you're building complex data processing workflows, orchestrating microservice calls, or just want to make your async tasks organized",
          "forks_count": 0,
          "language": "Java",
          "name": "jgraphlet",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-26T14:29:52Z"
        }
      ],
      "top_repos_stars": 4,
      "top_repos_forks": 2,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 8,
        "event_breakdown": [
          {
            "count": 3,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 5,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:11.314Z"
    },
    {
      "handle": "marcushellberg",
      "name": "Marcus Hellberg",
      "github_id": 883698,
      "display_name": "Marcus Hellberg",
      "avatar_url": "https://avatars.githubusercontent.com/u/883698?v=4",
      "bio": null,
      "company": "Vaadin",
      "location": "San Jose, CA",
      "blog": "",
      "twitter_username": null,
      "public_repos": 197,
      "public_gists": 3,
      "followers": 592,
      "following": 0,
      "hireable": null,
      "created_at": "2011-06-29T10:28:41Z",
      "updated_at": "2026-01-06T09:01:04Z",
      "top_repos": [
        {
          "description": "A Simpsons-inspired Phaser 3 platformer game",
          "forks_count": 0,
          "language": "TypeScript",
          "name": "adventures-of-rolph",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-22T09:48:53Z"
        },
        {
          "description": null,
          "forks_count": 3,
          "language": "Java",
          "name": "vaadin-ai-starter",
          "open_issues_count": 0,
          "stargazers_count": 9,
          "topics": [],
          "updated_at": "2026-01-28T21:12:10Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "TypeScript",
          "name": "gh-community-analytics",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-09T09:54:55Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "vaadin-create-ai-lab",
          "open_issues_count": 0,
          "stargazers_count": 2,
          "topics": [],
          "updated_at": "2025-10-22T16:57:22Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "vaadin-on-openliberty",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-10-08T18:44:05Z"
        }
      ],
      "top_repos_stars": 12,
      "top_repos_forks": 3,
      "languages": [
        "TypeScript",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 4,
        "event_breakdown": [
          {
            "count": 1,
            "type": "CreateEvent"
          },
          {
            "count": 3,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:36.424Z"
    },
    {
      "handle": "gamussa",
      "name": "Viktor Gamov",
      "github_id": 433085,
      "display_name": "Viktor Gamov",
      "avatar_url": "https://avatars.githubusercontent.com/u/433085?v=4",
      "bio": "Principal Developer Advocate @confluentinc\r\n\r\nex-@startreedata ex-@kong ex-@hazelcast\r\n\r\nGym aficionado 🏋️‍♂",
      "company": "Confluent",
      "location": "NY, USA",
      "blog": "http://gamov.io",
      "twitter_username": "gamussa",
      "public_repos": 426,
      "public_gists": 92,
      "followers": 589,
      "following": 97,
      "hireable": true,
      "created_at": "2010-10-09T02:13:04Z",
      "updated_at": "2026-01-08T17:16:16Z",
      "top_repos": [
        {
          "description": "Apache Flink PTF (Processing Table Functions) example with Kafka integration",
          "forks_count": 0,
          "language": "Java",
          "name": "flink-ptf-example",
          "open_issues_count": 1,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-30T15:56:45Z"
        },
        {
          "description": "VS Code extension to open Markdown and AsciiDoc files in Marked 2",
          "forks_count": 0,
          "language": "CSS",
          "name": "vscode-open-in-marked2",
          "open_issues_count": 1,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-30T04:22:52Z"
        },
        {
          "description": "demo of spec driven development using amazon kiro",
          "forks_count": 0,
          "language": null,
          "name": "robocoders-ai-native-devcon-kiro",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-18T23:14:03Z"
        },
        {
          "description": "A Spring Boot application that uses AI to generate concise summaries of live event messages from Kafka topics",
          "forks_count": 0,
          "language": "Java",
          "name": "spring-ai-confluent-mcp",
          "open_issues_count": 1,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-18T22:54:47Z"
        },
        {
          "description": "airline assistant demo using Spring AI",
          "forks_count": 0,
          "language": "Kotlin",
          "name": "codepocalypse-spring-ai-devfest-toulouse-2025",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-13T14:37:23Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Java",
        "CSS",
        "Kotlin"
      ],
      "recent_activity": {
        "recent_events": 34,
        "event_breakdown": [
          {
            "count": 2,
            "type": "CreateEvent"
          },
          {
            "count": 4,
            "type": "IssueCommentEvent"
          },
          {
            "count": 4,
            "type": "IssuesEvent"
          },
          {
            "count": 1,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 23,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:26.894Z"
    },
    {
      "handle": "michael-simons",
      "name": "Michael Simons",
      "github_id": 526383,
      "display_name": "Michael Simons",
      "avatar_url": "https://avatars.githubusercontent.com/u/526383?v=4",
      "bio": "👨‍👩‍👦‍👦👨🏻‍💻🚴🏻 – Father, Husband, Developer, Athlete. Java Champion, @NetBeans DreamTeam member, founder of @dailyfratze and @EuregJUG-Maas-Rhine.",
      "company": "@neo4j ",
      "location": "Aachen, Germany",
      "blog": "http://michael-simons.eu",
      "twitter_username": "rotnroll666",
      "public_repos": 137,
      "public_gists": 126,
      "followers": 552,
      "following": 55,
      "hireable": null,
      "created_at": "2010-12-16T21:19:43Z",
      "updated_at": "2026-01-05T08:20:24Z",
      "top_repos": [
        {
          "description": "The Jdbi library provides convenient, idiomatic access to relational databases in Java and other JVM technologies such as Kotlin, Clojure or Scala.",
          "forks_count": 0,
          "language": null,
          "name": "jdbi",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-12T07:02:58Z"
        },
        {
          "description": "Labelled Subgraph Query Benchmark – A lightweight benchmark suite focusing on subgraph matching queries. Note: This is a microbenchmark for system developers and not an official LDBC benchmark.",
          "forks_count": 0,
          "language": null,
          "name": "lsqb",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-06T10:16:06Z"
        },
        {
          "description": "Garmin SSO auth + Connect Python client",
          "forks_count": 0,
          "language": null,
          "name": "garth",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-20T13:44:39Z"
        },
        {
          "description": "A plugin for Flyway that enables Neo4j usage.",
          "forks_count": 1,
          "language": "Java",
          "name": "neo4j-flyway-database",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [
            "flyway",
            "flyway-migrations",
            "graph",
            "graphdatabase",
            "neo4j"
          ],
          "updated_at": "2025-11-03T08:16:55Z"
        },
        {
          "description": "ANTLR (ANother Tool for Language Recognition) is a powerful parser generator for reading, processing, executing, or translating structured text or binary files.",
          "forks_count": 0,
          "language": null,
          "name": "antlr4",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-01-17T08:23:46Z"
        }
      ],
      "top_repos_stars": 1,
      "top_repos_forks": 1,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 100,
        "event_breakdown": [
          {
            "count": 33,
            "type": "DeleteEvent"
          },
          {
            "count": 4,
            "type": "IssueCommentEvent"
          },
          {
            "count": 2,
            "type": "IssuesEvent"
          },
          {
            "count": 1,
            "type": "PullRequestEvent"
          },
          {
            "count": 56,
            "type": "PushEvent"
          },
          {
            "count": 4,
            "type": "ReleaseEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:24.377Z"
    },
    {
      "handle": "kittylyst",
      "name": "Ben Evans",
      "github_id": 81539,
      "display_name": "Ben Evans",
      "avatar_url": "https://avatars.githubusercontent.com/u/81539?v=4",
      "bio": "Educator, Author, Technologist. Java Champion & JavaOne Rock Star Speaker. Red Hat. InfoQ. Co-Founder, jClarity (acq MSFT). JCP Exec Committee (2012-18). ",
      "company": "@RedHatOfficial",
      "location": "Barcelona, Catalonia",
      "blog": "https://kittylyst.com",
      "twitter_username": null,
      "public_repos": 92,
      "public_gists": 2,
      "followers": 532,
      "following": 46,
      "hireable": null,
      "created_at": "2009-05-06T08:02:20Z",
      "updated_at": "2025-11-03T14:28:41Z",
      "top_repos": [
        {
          "description": "A very nice minimal blog with Roq and Tailwind CSS",
          "forks_count": 0,
          "language": null,
          "name": "the-code-site",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-02T19:38:21Z"
        },
        {
          "description": "Galago2D is a collection of classes that can be used to develop a 2D game in jMonkeyEngine3",
          "forks_count": 0,
          "language": null,
          "name": "Galago2D",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-29T20:57:31Z"
        },
        {
          "description": "IEC18004 (QR) 2D barcode generation library and command line",
          "forks_count": 0,
          "language": null,
          "name": "QR",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-06T10:53:44Z"
        },
        {
          "description": "https://openjdk.org/projects/code-tools",
          "forks_count": 0,
          "language": null,
          "name": "jextract",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-31T13:35:52Z"
        },
        {
          "description": "Java Code Samples for various developer.ibm.com projects",
          "forks_count": 0,
          "language": "Java",
          "name": "ibm-developer-java",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-03T14:27:49Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 2,
        "event_breakdown": [
          {
            "count": 1,
            "type": "ForkEvent"
          },
          {
            "count": 1,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:23.358Z"
    },
    {
      "handle": "eddumelendez",
      "name": "Eddú Meléndez Gonzales",
      "github_id": 1810547,
      "display_name": "Eddú Meléndez Gonzales",
      "avatar_url": "https://avatars.githubusercontent.com/u/1810547?v=4",
      "bio": "Skydiver, Java Chavo, Software Engineer, Open Source Contributor, Java Champion\r\n",
      "company": "@docker",
      "location": "Ica, Perú",
      "blog": "https://eddumelendez.dev/",
      "twitter_username": "eddumelendez",
      "public_repos": 266,
      "public_gists": 27,
      "followers": 501,
      "following": 133,
      "hireable": null,
      "created_at": "2012-06-02T19:33:31Z",
      "updated_at": "2026-01-23T19:34:00Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 1,
          "language": "Java",
          "name": "kcd-lima-2025",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-05T15:48:51Z"
        },
        {
          "description": "OpenRewrite recipes that perform common Java testing migration tasks.",
          "forks_count": 0,
          "language": null,
          "name": "rewrite-testing-frameworks",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-16T20:08:14Z"
        },
        {
          "description": "jdbc implementation for databend cloud",
          "forks_count": 0,
          "language": null,
          "name": "databend-jdbc",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-07-28T18:55:09Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "jackson-deserializer-issue",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-07-02T04:24:32Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "spring-ai-examples",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-06-12T18:18:31Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 1,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 56,
        "event_breakdown": [
          {
            "count": 2,
            "type": "CreateEvent"
          },
          {
            "count": 3,
            "type": "DeleteEvent"
          },
          {
            "count": 14,
            "type": "IssueCommentEvent"
          },
          {
            "count": 5,
            "type": "IssuesEvent"
          },
          {
            "count": 3,
            "type": "PullRequestEvent"
          },
          {
            "count": 5,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 5,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 19,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:58.319Z"
    },
    {
      "handle": "IanDarwin",
      "name": "Ian F. Darwin",
      "github_id": 4762842,
      "display_name": "Ian Darwin",
      "avatar_url": "https://avatars.githubusercontent.com/u/4762842?v=4",
      "bio": "Worked in computers all my life: software developer, mentor, inspiration, educator, author, consultant, open source contributor, photographer, parent of 3.",
      "company": null,
      "location": "Ontario, Canada",
      "blog": "https://darwinsys.com/",
      "twitter_username": null,
      "public_repos": 167,
      "public_gists": 1,
      "followers": 496,
      "following": 7,
      "hireable": null,
      "created_at": "2013-06-21T17:46:22Z",
      "updated_at": "2026-01-13T12:27:17Z",
      "top_repos": [
        {
          "description": "Generate signs and similar displays from text into STL for 3D printing",
          "forks_count": 0,
          "language": "Java",
          "name": "SignGenerator",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-26T16:36:23Z"
        },
        {
          "description": "Automated driver management and other helper features for Selenium WebDriver in Java",
          "forks_count": 0,
          "language": null,
          "name": "webdrivermanager",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-23T19:48:06Z"
        },
        {
          "description": "Automatically exported from code.google.com/p/sqlpower-library",
          "forks_count": 0,
          "language": null,
          "name": "sqlpower-library",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-13T02:22:34Z"
        },
        {
          "description": "Automatically exported from code.google.com/p/power-architect",
          "forks_count": 0,
          "language": null,
          "name": "power-architect",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-12T23:10:46Z"
        },
        {
          "description": "Simple list-detail demo: Quarkus, JSF+PrimeFaces, Hibernate, Panache \"Active Record\" style.",
          "forks_count": 0,
          "language": "Java",
          "name": "quarkus-jsf-panache-record",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-08T01:18:47Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 47,
        "event_breakdown": [
          {
            "count": 1,
            "type": "CreateEvent"
          },
          {
            "count": 2,
            "type": "DeleteEvent"
          },
          {
            "count": 2,
            "type": "PullRequestEvent"
          },
          {
            "count": 41,
            "type": "PushEvent"
          },
          {
            "count": 1,
            "type": "ReleaseEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:06.742Z"
    },
    {
      "handle": "jponge",
      "name": "Dr. Julien Ponge",
      "github_id": 25961,
      "display_name": "Julien Ponge",
      "avatar_url": "https://avatars.githubusercontent.com/u/25961?v=4",
      "bio": "Senior Principal Software Engineer | IBMer | Java Champion | Computer Scientist | PhD",
      "company": "IBM",
      "location": "Lyon, France",
      "blog": "https://julien.ponge.org/",
      "twitter_username": "jponge",
      "public_repos": 158,
      "public_gists": 52,
      "followers": 491,
      "following": 73,
      "hireable": null,
      "created_at": "2008-09-23T20:01:58Z",
      "updated_at": "2026-01-22T12:25:40Z",
      "top_repos": [
        {
          "description": "SmallRye OpenTelemetry - A CDI and Jakarta REST implementation of OpenTelemetry Tracing",
          "forks_count": 0,
          "language": null,
          "name": "smallrye-opentelemetry",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-14T13:56:50Z"
        },
        {
          "description": "SmallRye implementation of MicroProfile Fault Tolerance: bulkheads, circuit breakers, fallbacks, rate limits, retries, timeouts, and more",
          "forks_count": 0,
          "language": null,
          "name": "smallrye-fault-tolerance",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-14T09:12:26Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "datafaker-extension",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-25T20:52:27Z"
        },
        {
          "description": "Demos for Volcamp 2025",
          "forks_count": 0,
          "language": "Java",
          "name": "volcamp25-quarkus",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-01T06:48:01Z"
        },
        {
          "description": null,
          "forks_count": 2,
          "language": "Java",
          "name": "edgy",
          "open_issues_count": 4,
          "stargazers_count": 2,
          "topics": [],
          "updated_at": "2026-01-29T14:43:56Z"
        }
      ],
      "top_repos_stars": 2,
      "top_repos_forks": 2,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 100,
        "event_breakdown": [
          {
            "count": 4,
            "type": "CreateEvent"
          },
          {
            "count": 17,
            "type": "DeleteEvent"
          },
          {
            "count": 1,
            "type": "GollumEvent"
          },
          {
            "count": 19,
            "type": "IssueCommentEvent"
          },
          {
            "count": 2,
            "type": "IssuesEvent"
          },
          {
            "count": 16,
            "type": "PullRequestEvent"
          },
          {
            "count": 3,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 10,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 28,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:10.069Z"
    },
    {
      "handle": "ilopmar",
      "name": "Iván López",
      "github_id": 559192,
      "display_name": "Iván López",
      "avatar_url": "https://avatars.githubusercontent.com/u/559192?v=4",
      "bio": "JVM developer. Staff Software Engineer at @VMware. Previously Micronaut committer. Geek, Father, Speaker, Linux-lover 🐧, Lord of Sealand, MadridGUG organizer.",
      "company": "VMware",
      "location": "Madrid, Spain (Remote)",
      "blog": "",
      "twitter_username": "ilopmar",
      "public_repos": 159,
      "public_gists": 17,
      "followers": 483,
      "following": 23,
      "hireable": true,
      "created_at": "2011-01-12T10:09:56Z",
      "updated_at": "2025-12-17T07:10:26Z",
      "top_repos": [
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": "CSS",
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-08T17:57:22Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "commitconf-2025-springai",
          "open_issues_count": 0,
          "stargazers_count": 5,
          "topics": [],
          "updated_at": "2025-10-25T11:15:55Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "test",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-11-24T17:35:01Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "iberdrola-tech4techies-day",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-11-06T22:27:12Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "issue-spring-cloud-function-context",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-10-17T14:37:11Z"
        }
      ],
      "top_repos_stars": 5,
      "top_repos_forks": 0,
      "languages": [
        "CSS",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 18,
        "event_breakdown": [
          {
            "count": 3,
            "type": "CreateEvent"
          },
          {
            "count": 4,
            "type": "DeleteEvent"
          },
          {
            "count": 6,
            "type": "PullRequestEvent"
          },
          {
            "count": 5,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:51.043Z"
    },
    {
      "handle": "kabutz",
      "name": "Dr. Heinz M. Kabutz",
      "github_id": 332398,
      "display_name": null,
      "avatar_url": "https://avatars.githubusercontent.com/u/332398?v=4",
      "bio": null,
      "company": null,
      "location": null,
      "blog": "",
      "twitter_username": null,
      "public_repos": 148,
      "public_gists": 18,
      "followers": 452,
      "following": 5,
      "hireable": null,
      "created_at": "2010-07-14T21:46:28Z",
      "updated_at": "2025-11-28T15:35:51Z",
      "top_repos": [
        {
          "description": "Application for Mind Mapping, Knowledge Management, Project Management. Develop, organize and communicate your ideas and knowledge in the most effective way.",
          "forks_count": 0,
          "language": null,
          "name": "freeplane",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-09T12:15:14Z"
        },
        {
          "description": "Unlock your displays on your Mac! Flexible HiDPI scaling, XDR/HDR extra brightness, virtual screens, DDC control, extra dimming, PIP/streaming, EDID override and lots more!",
          "forks_count": 0,
          "language": null,
          "name": "BetterDisplay",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-06T15:55:30Z"
        },
        {
          "description": "website for music school of chania parents club",
          "forks_count": 0,
          "language": null,
          "name": "sgmsc-site",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-14T16:19:58Z"
        },
        {
          "description": "Codion Application Framework",
          "forks_count": 0,
          "language": null,
          "name": "codion",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-30T18:43:51Z"
        },
        {
          "description": "CLA Bot configuration for all JobRunr related projects",
          "forks_count": 0,
          "language": null,
          "name": "clabot-config",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-26T15:34:58Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [],
      "recent_activity": {
        "recent_events": 37,
        "event_breakdown": [
          {
            "count": 2,
            "type": "CreateEvent"
          },
          {
            "count": 1,
            "type": "DeleteEvent"
          },
          {
            "count": 2,
            "type": "ForkEvent"
          },
          {
            "count": 2,
            "type": "IssueCommentEvent"
          },
          {
            "count": 4,
            "type": "PullRequestEvent"
          },
          {
            "count": 26,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:45.676Z"
    },
    {
      "handle": "jonatan-ivanov",
      "name": "Jonatan Ivanov",
      "github_id": 3044070,
      "display_name": "Jonatan Ivanov",
      "avatar_url": "https://avatars.githubusercontent.com/u/3044070?v=4",
      "bio": "@micrometer-metrics and @spring-projects maintainer, Spring Observability Team member, Open Sourcerer, Speaker, Seattle JUG co-organizer, Java Champion",
      "company": "@broadcom",
      "location": "Seattle, WA",
      "blog": "https://develotters.com",
      "twitter_username": "jonatan_ivanov",
      "public_repos": 136,
      "public_gists": 14,
      "followers": 421,
      "following": 39,
      "hireable": true,
      "created_at": "2012-12-14T16:34:35Z",
      "updated_at": "2026-01-04T23:17:24Z",
      "top_repos": [
        {
          "description": "Minimalist Aurora Borealis Bar",
          "forks_count": 0,
          "language": "Shell",
          "name": "aurora-xbar",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-25T17:35:56Z"
        },
        {
          "description": "Recording metrics with high cardinality data is not a good idea, please don't do it",
          "forks_count": 0,
          "language": "Java",
          "name": "cardinality-trouble-registry-routing-demo",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-14T23:32:51Z"
        },
        {
          "description": "Awaitility is a small Java DSL for synchronizing asynchronous operations",
          "forks_count": 0,
          "language": null,
          "name": "awaitility",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-07T03:33:54Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "micrometer-gh-6931-multiple-gauge-registration-warning",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-03T00:40:11Z"
        },
        {
          "description": "Sample code using JDK 25's Scoped Values",
          "forks_count": 0,
          "language": null,
          "name": "scoped-values-sample",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-09T23:30:49Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Shell",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 99,
        "event_breakdown": [
          {
            "count": 2,
            "type": "CreateEvent"
          },
          {
            "count": 2,
            "type": "DeleteEvent"
          },
          {
            "count": 11,
            "type": "IssueCommentEvent"
          },
          {
            "count": 9,
            "type": "IssuesEvent"
          },
          {
            "count": 15,
            "type": "PullRequestEvent"
          },
          {
            "count": 24,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 15,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 20,
            "type": "PushEvent"
          },
          {
            "count": 1,
            "type": "WatchEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:42.817Z"
    },
    {
      "handle": "khmarbaise",
      "name": "Karl Heinz Marbaise",
      "github_id": 42484,
      "display_name": "Karl Heinz Marbaise",
      "avatar_url": "https://avatars.githubusercontent.com/u/42484?v=4",
      "bio": "Java Champion, Apache Maven PMC, Apache Software Foundation Member @apache, @mojohaus Mojo Haus Member, Java Developer, CI / CD, Freelancer",
      "company": "SoftwareEntwicklung Beratung Schulung",
      "location": "Würselen, Germany",
      "blog": "https://soebes.io",
      "twitter_username": null,
      "public_repos": 395,
      "public_gists": 12,
      "followers": 410,
      "following": 163,
      "hireable": true,
      "created_at": "2008-12-24T12:52:31Z",
      "updated_at": "2025-10-20T16:14:05Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "maven-initializer",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-26T16:58:47Z"
        },
        {
          "description": "Reproducer for maven-enforcer-plugin requireSameVersions rule issue",
          "forks_count": 0,
          "language": null,
          "name": "maven-enforcer-plugin-requireSameVersion",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-07-31T19:02:23Z"
        },
        {
          "description": "Java annotation-based framework for parsing Git like command line structures with deep extensibility",
          "forks_count": 0,
          "language": "Java",
          "name": "airline",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-02T20:43:14Z"
        },
        {
          "description": "Validation of record class based information",
          "forks_count": 0,
          "language": "Java",
          "name": "recordvalidation",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-06-28T08:17:28Z"
        },
        {
          "description": "Test Setup for reproducing a Maven 4.0.0-rc-4 Bug",
          "forks_count": 0,
          "language": "Java",
          "name": "maven400-rc4-bug-i",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-08-16T21:11:49Z"
        }
      ],
      "top_repos_stars": 1,
      "top_repos_forks": 0,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 20,
        "event_breakdown": [
          {
            "count": 1,
            "type": "CreateEvent"
          },
          {
            "count": 1,
            "type": "ForkEvent"
          },
          {
            "count": 2,
            "type": "IssueCommentEvent"
          },
          {
            "count": 4,
            "type": "IssuesEvent"
          },
          {
            "count": 1,
            "type": "PullRequestEvent"
          },
          {
            "count": 10,
            "type": "PushEvent"
          },
          {
            "count": 1,
            "type": "WatchEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:55.342Z"
    },
    {
      "handle": "shelajev",
      "name": "Oleg Šelajev",
      "github_id": 426039,
      "display_name": "Oleg Šelajev",
      "avatar_url": "https://avatars.githubusercontent.com/u/426039?v=4",
      "bio": "Developer relations at Docker, working on developer productivity, Testcontainers, and everything AI: sandboxes, models, agents, MCP, and so on",
      "company": "https://www.docker.com",
      "location": "Tartu, Estonia",
      "blog": "",
      "twitter_username": null,
      "public_repos": 162,
      "public_gists": 108,
      "followers": 383,
      "following": 8,
      "hireable": null,
      "created_at": "2010-10-04T06:50:46Z",
      "updated_at": "2026-01-28T16:52:10Z",
      "top_repos": [
        {
          "description": "Local RAG app combining QMD (hybrid markdown search) with Docker Model Runner for AI-powered answers",
          "forks_count": 0,
          "language": "Python",
          "name": "qmd-dmr-demo",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-28T13:29:33Z"
        },
        {
          "description": "Website clawd.bot",
          "forks_count": 0,
          "language": "Astro",
          "name": "clawd.bot",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-27T13:55:55Z"
        },
        {
          "description": "Your own personal AI assistant. Any OS. Any Platform. The lobster way. 🦞 ",
          "forks_count": 0,
          "language": "TypeScript",
          "name": "clawdbot",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-27T12:58:49Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "JavaScript",
          "name": "vowel-crush",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-10T10:29:23Z"
        },
        {
          "description": "An open-source AI agent that brings the power of Gemini directly into your terminal.",
          "forks_count": 0,
          "language": "TypeScript",
          "name": "gemini-cli",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-13T17:18:16Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Python",
        "Astro",
        "TypeScript",
        "JavaScript"
      ],
      "recent_activity": {
        "recent_events": 12,
        "event_breakdown": [
          {
            "count": 3,
            "type": "CreateEvent"
          },
          {
            "count": 2,
            "type": "ForkEvent"
          },
          {
            "count": 2,
            "type": "PullRequestEvent"
          },
          {
            "count": 5,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:19.573Z"
    },
    {
      "handle": "dhinojosa",
      "name": "Daniel Hinojosa",
      "github_id": 410757,
      "display_name": "Daniel Hinojosa",
      "avatar_url": "https://avatars.githubusercontent.com/u/410757?v=4",
      "bio": "Daniel Hinojosa is a programmer, consultant, instructor, speaker, and author",
      "company": null,
      "location": "Albuquerque, NM",
      "blog": "http://www.evolutionnext.com",
      "twitter_username": null,
      "public_repos": 406,
      "public_gists": 113,
      "followers": 382,
      "following": 39,
      "hireable": null,
      "created_at": "2010-09-22T00:10:41Z",
      "updated_at": "2025-12-15T12:14:15Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "ai-the-hard-way",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-29T18:09:06Z"
        },
        {
          "description": "Debezium Training and Learning Module",
          "forks_count": 0,
          "language": "CSS",
          "name": "debezium-training",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-03T13:33:10Z"
        },
        {
          "description": "Workshop for Virtual Thread, Structured Concurrency, and Stable Values",
          "forks_count": 2,
          "language": "Java",
          "name": "java_virtual_thread_structured_concurrency_workshop",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-17T02:16:42Z"
        },
        {
          "description": "Iceberg Workshop",
          "forks_count": 0,
          "language": "Jupyter Notebook",
          "name": "iceberg-workshop",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-28T11:49:18Z"
        },
        {
          "description": "Event Driven Architecture Workshop",
          "forks_count": 3,
          "language": "Java",
          "name": "event-driven-architecture",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-12-08T17:39:52Z"
        }
      ],
      "top_repos_stars": 1,
      "top_repos_forks": 5,
      "languages": [
        "Java",
        "CSS",
        "Jupyter Notebook"
      ],
      "recent_activity": {
        "recent_events": 11,
        "event_breakdown": [
          {
            "count": 1,
            "type": "CreateEvent"
          },
          {
            "count": 10,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:38.792Z"
    },
    {
      "handle": "emmanuelbernard",
      "name": "Emmanuel Bernard",
      "github_id": 300760,
      "display_name": "Emmanuel Bernard",
      "avatar_url": "https://avatars.githubusercontent.com/u/300760?v=4",
      "bio": "Senior Distinguished Engineer at Red Hat and Java Champion. Has his hands in @hibernate, @quarkusio, @lescastcodeurs and tons of other open source initiatives.",
      "company": "Red Hat",
      "location": "Paris",
      "blog": "http://emmanuelbernard.com/blog/",
      "twitter_username": "emmanuelbernard",
      "public_repos": 110,
      "public_gists": 137,
      "followers": 381,
      "following": 10,
      "hireable": null,
      "created_at": "2010-06-09T11:03:09Z",
      "updated_at": "2026-01-25T10:21:41Z",
      "top_repos": [
        {
          "description": "The agentic version of todo-demo-app",
          "forks_count": 0,
          "language": null,
          "name": "todo-agentic-app",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-12T15:29:30Z"
        },
        {
          "description": "Website for jbang.dev",
          "forks_count": 0,
          "language": null,
          "name": "jbang.dev",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-08T13:43:16Z"
        },
        {
          "description": "A2A deep dive - Quarkus demos",
          "forks_count": 0,
          "language": "Java",
          "name": "quarkus-a2a-deepdive",
          "open_issues_count": 0,
          "stargazers_count": 2,
          "topics": [],
          "updated_at": "2026-01-14T12:46:07Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "quarkus-todo-demo-app",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-24T13:29:28Z"
        },
        {
          "description": "A movie-based demo to illustrate Quarkus 3.x features",
          "forks_count": 0,
          "language": null,
          "name": "hello-quarkus",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-04-23T14:30:16Z"
        }
      ],
      "top_repos_stars": 2,
      "top_repos_forks": 0,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 16,
        "event_breakdown": [
          {
            "count": 3,
            "type": "CreateEvent"
          },
          {
            "count": 1,
            "type": "DeleteEvent"
          },
          {
            "count": 1,
            "type": "ForkEvent"
          },
          {
            "count": 2,
            "type": "IssueCommentEvent"
          },
          {
            "count": 1,
            "type": "IssuesEvent"
          },
          {
            "count": 1,
            "type": "PullRequestEvent"
          },
          {
            "count": 7,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:00.603Z"
    },
    {
      "handle": "myfear",
      "name": "Markus Eisele",
      "github_id": 1358554,
      "display_name": "Markus Eisele",
      "avatar_url": "https://avatars.githubusercontent.com/u/1358554?v=4",
      "bio": "Markus is a Java Champion, former Java EE Expert Group member, founder of JavaLand, reputed speaker at Java conferences around the world.",
      "company": "@jboss ",
      "location": "Munich",
      "blog": "Https://www.eisele.net",
      "twitter_username": "myfear",
      "public_repos": 96,
      "public_gists": 4,
      "followers": 363,
      "following": 74,
      "hireable": null,
      "created_at": "2012-01-20T14:59:08Z",
      "updated_at": "2026-01-28T21:37:07Z",
      "top_repos": [
        {
          "description": "Own your miles, share your journey.",
          "forks_count": 4,
          "language": "HTML",
          "name": "open-pace",
          "open_issues_count": 0,
          "stargazers_count": 47,
          "topics": [
            "fediverse",
            "open-pace"
          ],
          "updated_at": "2026-01-28T13:35:07Z"
        },
        {
          "description": "AIContext for Java",
          "forks_count": 0,
          "language": "Java",
          "name": "aicontext",
          "open_issues_count": 0,
          "stargazers_count": 2,
          "topics": [
            "ai-agents",
            "java",
            "javadoc"
          ],
          "updated_at": "2026-01-29T21:12:52Z"
        },
        {
          "description": "Quarkus: Supersonic Subatomic Java. ",
          "forks_count": 0,
          "language": null,
          "name": "quarkus",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-10T17:40:35Z"
        },
        {
          "description": "Java Code Samples for various developer.ibm.com projects",
          "forks_count": 0,
          "language": "Java",
          "name": "ibm-developer-java",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-12T16:45:39Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "JavaScript",
          "name": "quarkus-langchain4j-athlete-intelligence",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-20T09:13:03Z"
        }
      ],
      "top_repos_stars": 49,
      "top_repos_forks": 4,
      "languages": [
        "HTML",
        "Java",
        "JavaScript"
      ],
      "recent_activity": {
        "recent_events": 69,
        "event_breakdown": [
          {
            "count": 2,
            "type": "CreateEvent"
          },
          {
            "count": 3,
            "type": "ForkEvent"
          },
          {
            "count": 4,
            "type": "IssueCommentEvent"
          },
          {
            "count": 1,
            "type": "IssuesEvent"
          },
          {
            "count": 1,
            "type": "MemberEvent"
          },
          {
            "count": 8,
            "type": "PullRequestEvent"
          },
          {
            "count": 47,
            "type": "PushEvent"
          },
          {
            "count": 3,
            "type": "WatchEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:19.476Z"
    },
    {
      "handle": "ivargrimstad",
      "name": "Ivar Grimstad",
      "github_id": 149188,
      "display_name": "Ivar Grimstad",
      "avatar_url": "https://avatars.githubusercontent.com/u/149188?v=4",
      "bio": "\r\n    Java Champion, Jakarta EE Developer Advocate, JUG Leader, JCP EC Member, EE4J PMC, Speaker\r\n",
      "company": null,
      "location": "Malmö, Sweden",
      "blog": "www.agilejava.eu",
      "twitter_username": "ivar_grimstad",
      "public_repos": 149,
      "public_gists": 6,
      "followers": 362,
      "following": 12,
      "hireable": null,
      "created_at": "2009-11-05T09:08:54Z",
      "updated_at": "2026-01-22T22:41:27Z",
      "top_repos": [
        {
          "description": "One API, any AI",
          "forks_count": 0,
          "language": "Java",
          "name": "omniai",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-19T11:46:58Z"
        },
        {
          "description": "JakartaOne Live is a one day virtual conference for developers and technical business leaders that brings insights into the current state and future of Jakarta EE and related technologies focused on developing cloud-native Java applications. ",
          "forks_count": 0,
          "language": null,
          "name": "jakartaone.org",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-15T13:31:02Z"
        },
        {
          "description": "Jakarta Agentic Artificial Intelligence",
          "forks_count": 0,
          "language": "Java",
          "name": "agentic-ai",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-15T16:16:31Z"
        },
        {
          "description": "Jakarta EE Pet Store",
          "forks_count": 0,
          "language": "Java",
          "name": "pet-store",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-26T14:50:08Z"
        },
        {
          "description": "Easily and Quickly Define, Develop and Integrate your MCP Resources, Prompts and Tools with Java annotations. Built on the official MCP Java SDK, but no Spring.",
          "forks_count": 0,
          "language": null,
          "name": "mcp-declarative-java-sdk",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-06T08:07:27Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 100,
        "event_breakdown": [
          {
            "count": 13,
            "type": "CreateEvent"
          },
          {
            "count": 10,
            "type": "DeleteEvent"
          },
          {
            "count": 3,
            "type": "ForkEvent"
          },
          {
            "count": 6,
            "type": "IssueCommentEvent"
          },
          {
            "count": 19,
            "type": "IssuesEvent"
          },
          {
            "count": 26,
            "type": "PullRequestEvent"
          },
          {
            "count": 1,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 22,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:28.545Z"
    },
    {
      "handle": "domix",
      "name": "Domingo Suarez",
      "github_id": 21805,
      "display_name": "Domingo Suarez Torres",
      "avatar_url": "https://avatars.githubusercontent.com/u/21805?v=4",
      "bio": "Utopian software designer",
      "company": "@CirculoSiete @bandohq",
      "location": "Mexico City",
      "blog": "http://www.domingosuarez.com",
      "twitter_username": "domix",
      "public_repos": 274,
      "public_gists": 35,
      "followers": 337,
      "following": 387,
      "hireable": true,
      "created_at": "2008-08-25T02:50:12Z",
      "updated_at": "2026-01-05T15:11:14Z",
      "top_repos": [
        {
          "description": "problem is a lightweight, opinionated Java library for treating failures as first-class problems.",
          "forks_count": 0,
          "language": "Java",
          "name": "problem",
          "open_issues_count": 2,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2026-01-16T18:43:23Z"
        },
        {
          "description": "A notes webapp",
          "forks_count": 0,
          "language": null,
          "name": "textarea",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-26T06:40:46Z"
        },
        {
          "description": "FULL Augment Code, Claude Code, Cluely, CodeBuddy, Comet, Cursor, Devin AI, Junie, Kiro, Leap.new, Lovable, Manus, NotionAI, Orchids.app, Perplexity, Poke, Qoder, Replit, Same.dev, Trae, Traycer AI, VSCode Agent, Warp.dev, Windsurf, Xcode, Z.ai Code, Dia & v0. (And other Open Sourced) System Prompts, Internal Tools & AI Models",
          "forks_count": 0,
          "language": null,
          "name": "system-prompts-and-models-of-ai-tools",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-23T19:14:12Z"
        },
        {
          "description": "🍌 500+ selected Nano Banana Pro prompts with images, multilingual support, and instant gallery preview. Open-source prompt engineering library",
          "forks_count": 0,
          "language": null,
          "name": "awesome-nano-banana-pro-prompts",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-02T14:08:22Z"
        },
        {
          "description": "PoC Maven Central Publication",
          "forks_count": 0,
          "language": "Groovy",
          "name": "pubpoc",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-12T18:35:18Z"
        }
      ],
      "top_repos_stars": 1,
      "top_repos_forks": 0,
      "languages": [
        "Java",
        "Groovy"
      ],
      "recent_activity": {
        "recent_events": 77,
        "event_breakdown": [
          {
            "count": 9,
            "type": "CreateEvent"
          },
          {
            "count": 6,
            "type": "DeleteEvent"
          },
          {
            "count": 1,
            "type": "IssueCommentEvent"
          },
          {
            "count": 18,
            "type": "PullRequestEvent"
          },
          {
            "count": 6,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 37,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:27.656Z"
    },
    {
      "handle": "gdams",
      "name": "George Adams",
      "github_id": 20224954,
      "display_name": "George Adams",
      "avatar_url": "https://avatars.githubusercontent.com/u/20224954?v=4",
      "bio": "Go Group Manager @microsoft \r\nJava Champion,\r\nChairman @adoptium",
      "company": "@Microsoft",
      "location": "United Kingdom",
      "blog": "",
      "twitter_username": "gdams_",
      "public_repos": 218,
      "public_gists": 6,
      "followers": 332,
      "following": 34,
      "hireable": null,
      "created_at": "2016-06-30T12:00:20Z",
      "updated_at": "2026-01-15T15:24:16Z",
      "top_repos": [
        {
          "description": "A library for calling C functions from Go without Cgo",
          "forks_count": 0,
          "language": null,
          "name": "purego",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-14T12:22:07Z"
        },
        {
          "description": "A repository to store artifacts for publishing on Adoptium marketplace",
          "forks_count": 0,
          "language": null,
          "name": "azul-adoptium",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-17T10:29:17Z"
        },
        {
          "description": "macOS Crypto bindings for Go",
          "forks_count": 0,
          "language": null,
          "name": "go-crypto-darwin",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-22T12:35:34Z"
        },
        {
          "description": "Semantic Kernel for Java. Integrate cutting-edge LLM technology quickly and easily into your Java based apps. See https://aka.ms/semantic-kernel.",
          "forks_count": 0,
          "language": null,
          "name": "semantic-kernel-java",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-15T11:44:30Z"
        },
        {
          "description": "Delve is a debugger for the Go programming language.",
          "forks_count": 0,
          "language": null,
          "name": "delve",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-07T15:54:01Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [],
      "recent_activity": {
        "recent_events": 76,
        "event_breakdown": [
          {
            "count": 6,
            "type": "CreateEvent"
          },
          {
            "count": 7,
            "type": "DeleteEvent"
          },
          {
            "count": 2,
            "type": "IssueCommentEvent"
          },
          {
            "count": 1,
            "type": "IssuesEvent"
          },
          {
            "count": 13,
            "type": "PullRequestEvent"
          },
          {
            "count": 9,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 10,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 28,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:22:51.310Z"
    },
    {
      "handle": "karianna",
      "name": "Martijn Verburg",
      "github_id": 180840,
      "display_name": "Martijn Verburg",
      "avatar_url": "https://avatars.githubusercontent.com/u/180840?v=4",
      "bio": "Principal Software Engineering Group Manager @microsoft.  Director of the @LondonJavaCommunity, on the Steering Committee for @adoptium, and the JCP.",
      "company": "@Microsoft",
      "location": "London",
      "blog": "http://martijnverburg.blogspot.com",
      "twitter_username": "karianna",
      "public_repos": 262,
      "public_gists": 2,
      "followers": 325,
      "following": 29,
      "hireable": null,
      "created_at": "2010-01-12T16:27:40Z",
      "updated_at": "2025-11-16T22:56:18Z",
      "top_repos": [
        {
          "description": "Installer scripts for Eclipse Temurin binaries",
          "forks_count": 0,
          "language": null,
          "name": "installer",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-30T01:54:49Z"
        },
        {
          "description": "Beads - A memory upgrade for your coding agent",
          "forks_count": 0,
          "language": null,
          "name": "beads",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-15T19:23:00Z"
        },
        {
          "description": "Production-ready Claude subagents collection with 100+ specialized AI agents for full-stack development, DevOps, data science, and business operations.",
          "forks_count": 0,
          "language": null,
          "name": "awesome-claude-code-subagents",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-16T22:58:38Z"
        },
        {
          "description": "Samples using the Agent2Agent (A2A) Protocol",
          "forks_count": 0,
          "language": null,
          "name": "a2a-samples",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-05T13:09:21Z"
        },
        {
          "description": "vue javascript project",
          "forks_count": 0,
          "language": null,
          "name": "pcgen-js",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-10T02:00:50Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [],
      "recent_activity": {
        "recent_events": 78,
        "event_breakdown": [
          {
            "count": 1,
            "type": "CreateEvent"
          },
          {
            "count": 10,
            "type": "DeleteEvent"
          },
          {
            "count": 1,
            "type": "ForkEvent"
          },
          {
            "count": 10,
            "type": "IssueCommentEvent"
          },
          {
            "count": 2,
            "type": "IssuesEvent"
          },
          {
            "count": 3,
            "type": "PullRequestEvent"
          },
          {
            "count": 4,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 25,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 22,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:36.520Z"
    },
    {
      "handle": "evanchooly",
      "name": "Justin Lee",
      "github_id": 195021,
      "display_name": "Justin Lee",
      "avatar_url": "https://avatars.githubusercontent.com/u/195021?v=4",
      "bio": "Java Champion. Kotlin fanatic. Bit twiddler. New Yorker. Senior Software Engineer at @datadog",
      "company": "@datadog",
      "location": "New York",
      "blog": "https://www.antwerkz.com",
      "twitter_username": "evanchooly",
      "public_repos": 99,
      "public_gists": 14,
      "followers": 322,
      "following": 4,
      "hireable": null,
      "created_at": "2010-02-03T02:35:53Z",
      "updated_at": "2026-01-29T18:25:27Z",
      "top_repos": [
        {
          "description": "Automated mass refactoring of source code.",
          "forks_count": 0,
          "language": null,
          "name": "rewrite",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-11T00:52:26Z"
        },
        {
          "description": "The official MongoDB drivers for Java, Kotlin, and Scala",
          "forks_count": 0,
          "language": null,
          "name": "mongo-java-driver",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-03-28T02:45:53Z"
        },
        {
          "description": "  Revapi is an API analysis and change tracking tool written in Java.  Its focus is mainly on Java language itself but it has been specifically designed to not be limited to just Java. API is much more than just java classes - also various configuration files, schemas, etc. can contribute to it and users can become reliant on them.",
          "forks_count": 0,
          "language": null,
          "name": "revapi",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-02-08T20:17:34Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "JavaScript",
          "name": "underthehood",
          "open_issues_count": 1,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-07-18T03:07:12Z"
        },
        {
          "description": "Advent of Code 2024 in kotlin",
          "forks_count": 0,
          "language": "Kotlin",
          "name": "Advent2024",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-12-04T03:30:22Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "JavaScript",
        "Kotlin"
      ],
      "recent_activity": {
        "recent_events": 67,
        "event_breakdown": [
          {
            "count": 3,
            "type": "CreateEvent"
          },
          {
            "count": 13,
            "type": "IssueCommentEvent"
          },
          {
            "count": 1,
            "type": "IssuesEvent"
          },
          {
            "count": 3,
            "type": "PullRequestEvent"
          },
          {
            "count": 1,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 4,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 42,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:49.878Z"
    },
    {
      "handle": "ghillert",
      "name": "Gunnar Hillert",
      "github_id": 685363,
      "display_name": "Gunnar Hillert",
      "avatar_url": "https://avatars.githubusercontent.com/u/685363?v=4",
      "bio": "Founder @ Hillert Inc., Full-stack Java + Spring Developer, Java Champion, OSS, DevNexus co-founder. From Berlin 🇩🇪 Formerly @Oracle Coherence @Spring-project",
      "company": "Hillert, Inc.",
      "location": "Holualoa, HI",
      "blog": "https://hillert.com",
      "twitter_username": null,
      "public_repos": 130,
      "public_gists": 10,
      "followers": 281,
      "following": 20,
      "hireable": true,
      "created_at": "2011-03-23T04:49:59Z",
      "updated_at": "2025-11-20T07:32:36Z",
      "top_repos": [
        {
          "description": "Extension to the jte-spring-boot-starter-3 adding various MVC-specific JTE helpers",
          "forks_count": 0,
          "language": null,
          "name": "jte-mvc",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-27T19:39:30Z"
        },
        {
          "description": "Image Processing Filters for Java",
          "forks_count": 0,
          "language": "Java",
          "name": "image-filters-4j",
          "open_issues_count": 4,
          "stargazers_count": 2,
          "topics": [],
          "updated_at": "2026-01-20T09:58:02Z"
        },
        {
          "description": "GeoJson POJOs for Jackson - serialize and deserialize objects with ease",
          "forks_count": 0,
          "language": "Java",
          "name": "geojson-jackson",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-20T09:55:13Z"
        },
        {
          "description": "Utility classes",
          "forks_count": 0,
          "language": null,
          "name": "gbif-common",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-19T07:45:46Z"
        },
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": null,
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-12-05T08:22:15Z"
        }
      ],
      "top_repos_stars": 2,
      "top_repos_forks": 0,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 28,
        "event_breakdown": [
          {
            "count": 1,
            "type": "CreateEvent"
          },
          {
            "count": 2,
            "type": "DeleteEvent"
          },
          {
            "count": 2,
            "type": "IssueCommentEvent"
          },
          {
            "count": 2,
            "type": "IssuesEvent"
          },
          {
            "count": 18,
            "type": "PushEvent"
          },
          {
            "count": 1,
            "type": "ReleaseEvent"
          },
          {
            "count": 2,
            "type": "WatchEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:37.735Z"
    },
    {
      "handle": "simasch",
      "name": "Simon Martinelli",
      "github_id": 593352,
      "display_name": "Simon Martinelli",
      "avatar_url": "https://avatars.githubusercontent.com/u/593352?v=4",
      "bio": "Java Champion, Vaadin Champion, Oracle ACE Pro, Speaker, Programming Architect, and Lecturer for Software Architecture and Persistence",
      "company": "@martinellich",
      "location": "Erlach, Switzerland",
      "blog": "https://martinelli.ch",
      "twitter_username": "simas_ch",
      "public_repos": 207,
      "public_gists": 1,
      "followers": 281,
      "following": 15,
      "hireable": true,
      "created_at": "2011-01-31T19:30:34Z",
      "updated_at": "2025-12-27T09:54:32Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "aiup-task-manager",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-25T15:12:54Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "case-management",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2026-01-16T21:30:51Z"
        },
        {
          "description": "Testcontainers Community Module Registry",
          "forks_count": 0,
          "language": null,
          "name": "community-module-registry",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-18T04:33:10Z"
        },
        {
          "description": "Performance comparison between SpringBoot and Quarkus",
          "forks_count": 0,
          "language": "Java",
          "name": "spring-quarkus-perf-comparison",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-15T15:55:20Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "quarkus-vs-springboot",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-03T14:58:39Z"
        }
      ],
      "top_repos_stars": 1,
      "top_repos_forks": 0,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 100,
        "event_breakdown": [
          {
            "count": 2,
            "type": "CreateEvent"
          },
          {
            "count": 5,
            "type": "DeleteEvent"
          },
          {
            "count": 2,
            "type": "IssueCommentEvent"
          },
          {
            "count": 2,
            "type": "IssuesEvent"
          },
          {
            "count": 2,
            "type": "PullRequestEvent"
          },
          {
            "count": 87,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:56.707Z"
    },
    {
      "handle": "godin",
      "name": "Evgeny Mandrikov",
      "github_id": 138671,
      "display_name": "Evgeny Mandrikov",
      "avatar_url": "https://avatars.githubusercontent.com/u/138671?v=4",
      "bio": "@JaCoCo Project co-Lead, Java Champion, Principal Software Engineer @SonarSource ",
      "company": "@SonarSource",
      "location": "Geneva, Switzerland",
      "blog": "https://godin.github.io",
      "twitter_username": "_Godin_",
      "public_repos": 147,
      "public_gists": 6,
      "followers": 228,
      "following": 28,
      "hireable": null,
      "created_at": "2009-10-12T13:26:30Z",
      "updated_at": "2026-01-18T12:26:36Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "asm",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-21T13:54:02Z"
        },
        {
          "description": "Reproducible Central: rebuild instructions for artifacts published to (Maven) Central Repository",
          "forks_count": 0,
          "language": "Shell",
          "name": "reproducible-central",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-15T13:33:20Z"
        },
        {
          "description": "Elegant parsing in Java and Scala - lightweight, easy-to-use, powerful.",
          "forks_count": 0,
          "language": "Java",
          "name": "parboiled",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-15T08:47:03Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "asm-java5-issue",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-19T12:06:10Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "test-gh",
          "open_issues_count": 1,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-17T15:36:36Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Java",
        "Shell"
      ],
      "recent_activity": {
        "recent_events": 100,
        "event_breakdown": [
          {
            "count": 4,
            "type": "CreateEvent"
          },
          {
            "count": 10,
            "type": "DeleteEvent"
          },
          {
            "count": 2,
            "type": "GollumEvent"
          },
          {
            "count": 3,
            "type": "IssueCommentEvent"
          },
          {
            "count": 2,
            "type": "IssuesEvent"
          },
          {
            "count": 18,
            "type": "PullRequestEvent"
          },
          {
            "count": 10,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 48,
            "type": "PushEvent"
          },
          {
            "count": 3,
            "type": "WatchEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:52.720Z"
    },
    {
      "handle": "ebullient",
      "name": "Erin Schnabel",
      "github_id": 808713,
      "display_name": "Erin Schnabel",
      "avatar_url": "https://avatars.githubusercontent.com/u/808713?v=4",
      "bio": "Java Champion. Maker of things. Distinguished Engineer @ Red Hat, Senior Technical Staff Member @ IBM",
      "company": "@IBM, @commonhaus ",
      "location": null,
      "blog": "https://www.ebullient.dev",
      "twitter_username": null,
      "public_repos": 70,
      "public_gists": 7,
      "followers": 210,
      "following": 32,
      "hireable": null,
      "created_at": "2011-05-24T23:22:23Z",
      "updated_at": "2026-01-28T22:34:18Z",
      "top_repos": [
        {
          "description": "Generated by code.quarkus.io",
          "forks_count": 1,
          "language": "Java",
          "name": "quarkus-soloplay",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-29T21:38:55Z"
        },
        {
          "description": "MCP tool allowing Open WebUI or Claude Desktop to retrieve files from your vault",
          "forks_count": 0,
          "language": "TypeScript",
          "name": "obsidian-vault-mcp",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [
            "mcp-server",
            "mcp-tools",
            "obsidian",
            "obsidian-plugin"
          ],
          "updated_at": "2026-01-26T02:20:23Z"
        },
        {
          "description": "Emoji Shortcodes - Obsidian Plugin | Adds Support for Emoji Shortcodes to Obsidian",
          "forks_count": 0,
          "language": null,
          "name": "obsidian-emoji-shortcodes",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-14T13:05:45Z"
        },
        {
          "description": "Simple plugin to display a deck of cards with simple repetition",
          "forks_count": 0,
          "language": "TypeScript",
          "name": "obsidian-deck-notes",
          "open_issues_count": 5,
          "stargazers_count": 2,
          "topics": [
            "decks",
            "flashcards",
            "obsidian",
            "obsidian-plugin"
          ],
          "updated_at": "2026-01-20T12:17:29Z"
        },
        {
          "description": "AI content generation for Obsidian. Features custom prompts, content filtering, link expansion, continuous conversations, and extensible filter API.",
          "forks_count": 0,
          "language": "TypeScript",
          "name": "obsidian-prompt-flow",
          "open_issues_count": 5,
          "stargazers_count": 5,
          "topics": [
            "obsidian",
            "obsidian-plugin",
            "ollama",
            "ollama-client"
          ],
          "updated_at": "2026-01-17T18:55:58Z"
        }
      ],
      "top_repos_stars": 8,
      "top_repos_forks": 1,
      "languages": [
        "Java",
        "TypeScript"
      ],
      "recent_activity": {
        "recent_events": 99,
        "event_breakdown": [
          {
            "count": 2,
            "type": "CreateEvent"
          },
          {
            "count": 2,
            "type": "DeleteEvent"
          },
          {
            "count": 15,
            "type": "IssueCommentEvent"
          },
          {
            "count": 5,
            "type": "IssuesEvent"
          },
          {
            "count": 2,
            "type": "PullRequestEvent"
          },
          {
            "count": 4,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 57,
            "type": "PushEvent"
          },
          {
            "count": 12,
            "type": "ReleaseEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:21.234Z"
    },
    {
      "handle": "thegreystone",
      "name": "Marcus Hirt",
      "github_id": 16906077,
      "display_name": "Marcus Hirt",
      "avatar_url": "https://avatars.githubusercontent.com/u/16906077?v=4",
      "bio": "Director at Datadog. Former Java Platform Group. Project lead for the OpenJDK JMC project. Once co-founded Appeal, the company creating the JRockit JVM.",
      "company": "Datadog",
      "location": "Switzerland",
      "blog": "https://hirt.se/blog",
      "twitter_username": "hirt",
      "public_repos": 45,
      "public_gists": 1,
      "followers": 208,
      "following": 6,
      "hireable": null,
      "created_at": "2016-01-26T20:22:06Z",
      "updated_at": "2026-01-23T18:47:34Z",
      "top_repos": [
        {
          "description": "A small repo of ready to use codegen support files",
          "forks_count": 0,
          "language": null,
          "name": "codegenial",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-15T13:58:30Z"
        },
        {
          "description": "Profiling SIG utilities",
          "forks_count": 0,
          "language": null,
          "name": "sig-profiling",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-09T11:59:25Z"
        },
        {
          "description": "Robo4j.io robotics/IoT framework",
          "forks_count": 0,
          "language": null,
          "name": "robo4j",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-10T15:53:34Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "switzerland2025",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-07-09T18:05:30Z"
        },
        {
          "description": "🎵 Plays some background music while Maven is building",
          "forks_count": 0,
          "language": null,
          "name": "music-maven-plugin",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-04-28T12:32:12Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [],
      "recent_activity": {
        "recent_events": 40,
        "event_breakdown": [
          {
            "count": 9,
            "type": "CreateEvent"
          },
          {
            "count": 4,
            "type": "IssueCommentEvent"
          },
          {
            "count": 13,
            "type": "PullRequestEvent"
          },
          {
            "count": 1,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 13,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:40.117Z"
    },
    {
      "handle": "sbordet",
      "name": "Simone Bordet",
      "github_id": 414681,
      "display_name": "Simone Bordet",
      "avatar_url": "https://avatars.githubusercontent.com/u/414681?v=4",
      "bio": "Programmer. Jetty & CometD. Webtide Lead Architect. Java Champion.",
      "company": "@Webtide",
      "location": "Torino, Italy",
      "blog": "https://webtide.com/author/simon/",
      "twitter_username": "simonebordet",
      "public_repos": 13,
      "public_gists": 2,
      "followers": 206,
      "following": 0,
      "hireable": null,
      "created_at": "2010-09-24T17:46:09Z",
      "updated_at": "2025-12-09T11:30:32Z",
      "top_repos": [
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": "CSS",
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-12-04T18:13:48Z"
        },
        {
          "description": "Lesson a Avogadro high school about internal iteration",
          "forks_count": 0,
          "language": "Java",
          "name": "avogadro-internal-iteration",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-11-19T10:28:51Z"
        },
        {
          "description": ":gem: A fast, open source text processor and publishing toolchain, written in Ruby, for converting AsciiDoc content to HTML 5, DocBook 5, and other formats.",
          "forks_count": 0,
          "language": null,
          "name": "asciidoctor",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2020-04-18T11:15:49Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "dynamic-proxies-samples",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2022-10-20T22:59:58Z"
        },
        {
          "description": "UNIX domain sockets (AF_UNIX) for Java",
          "forks_count": 0,
          "language": "Java",
          "name": "jnr-unixsocket",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2022-10-20T22:59:58Z"
        }
      ],
      "top_repos_stars": 3,
      "top_repos_forks": 0,
      "languages": [
        "CSS",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 100,
        "event_breakdown": [
          {
            "count": 1,
            "type": "CreateEvent"
          },
          {
            "count": 6,
            "type": "DeleteEvent"
          },
          {
            "count": 4,
            "type": "IssueCommentEvent"
          },
          {
            "count": 12,
            "type": "IssuesEvent"
          },
          {
            "count": 31,
            "type": "PullRequestEvent"
          },
          {
            "count": 11,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 9,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 26,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:03.178Z"
    },
    {
      "handle": "antoinesd",
      "name": "Antoine Sabot-Durand",
      "github_id": 489817,
      "display_name": "Antoine Sabot-Durand",
      "avatar_url": "https://avatars.githubusercontent.com/u/489817?v=4",
      "bio": "Java Champion, consultant for SCIAM former CDI spec lead, I'm also involved in MicroProfile and Jakarta EE related project",
      "company": "@SCIAM-FR ",
      "location": "Paris, France",
      "blog": "http://www.next-presso.com",
      "twitter_username": "antoine_sd",
      "public_repos": 148,
      "public_gists": 7,
      "followers": 201,
      "following": 26,
      "hireable": null,
      "created_at": "2010-11-20T16:51:41Z",
      "updated_at": "2026-01-20T16:03:20Z",
      "top_repos": [
        {
          "description": "Suivi des exercices pratiques avec tableau markdown et kanban (progression synchro avec ChatGPT)",
          "forks_count": 0,
          "language": null,
          "name": "Projet_1_Exercices_Rob",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-06-16T10:26:15Z"
        },
        {
          "description": "Slides and code for the Mainframe to Quarkus talk",
          "forks_count": 0,
          "language": null,
          "name": "mainframe-to-quarkus",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-04-21T19:43:00Z"
        },
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": null,
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-12-02T16:55:57Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "Exo-SumPayments",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-07-03T12:36:12Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "cdi-extensions-demo",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-03-20T14:36:34Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [],
      "recent_activity": {
        "recent_events": 5,
        "event_breakdown": [
          {
            "count": 1,
            "type": "DeleteEvent"
          },
          {
            "count": 1,
            "type": "IssueCommentEvent"
          },
          {
            "count": 1,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 2,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:13.814Z"
    },
    {
      "handle": "grobmeier",
      "name": "Christian Grobmeier",
      "github_id": 873786,
      "display_name": "Christian Grobmeier",
      "avatar_url": "https://avatars.githubusercontent.com/u/873786?v=4",
      "bio": "Java Champion, ASF VP of Data Privacy, and maintainer of Apache Log4j. Writing about ethics, burnout, and resilience in open source.",
      "company": "Grobmeier Solutions GmbH",
      "location": "Germany",
      "blog": "https://grobmeier.de",
      "twitter_username": null,
      "public_repos": 90,
      "public_gists": 4,
      "followers": 199,
      "following": 31,
      "hireable": true,
      "created_at": "2011-06-24T16:49:09Z",
      "updated_at": "2026-01-08T19:10:35Z",
      "top_repos": [
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": null,
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-19T14:33:07Z"
        },
        {
          "description": "A minimal newsletter theme for Ghost",
          "forks_count": 0,
          "language": null,
          "name": "Dawn",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-06T12:51:16Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "java-logging",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-20T11:32:03Z"
        },
        {
          "description": "Documentation base for Specification pages be published at jakarta.ee via Hugo and git submodules",
          "forks_count": 0,
          "language": null,
          "name": "specifications",
          "open_issues_count": 1,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-03-20T11:55:09Z"
        },
        {
          "description": "Apache log4j1",
          "forks_count": 0,
          "language": null,
          "name": "logging-log4j1",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-03-18T16:14:18Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 19,
        "event_breakdown": [
          {
            "count": 1,
            "type": "ForkEvent"
          },
          {
            "count": 2,
            "type": "IssuesEvent"
          },
          {
            "count": 2,
            "type": "PullRequestEvent"
          },
          {
            "count": 3,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 9,
            "type": "PushEvent"
          },
          {
            "count": 2,
            "type": "WatchEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:29.860Z"
    },
    {
      "handle": "szegedi",
      "name": "Attila Szegedi",
      "github_id": 122822,
      "display_name": "Attila Szegedi",
      "avatar_url": "https://avatars.githubusercontent.com/u/122822?v=4",
      "bio": null,
      "company": "@DataDog ",
      "location": "Zug, Switzerland",
      "blog": "",
      "twitter_username": null,
      "public_repos": 23,
      "public_gists": 9,
      "followers": 193,
      "following": 4,
      "hireable": null,
      "created_at": "2009-09-03T12:56:14Z",
      "updated_at": "2026-01-26T20:28:48Z",
      "top_repos": [
        {
          "description": "szegedi.live website",
          "forks_count": 0,
          "language": "Nunjucks",
          "name": "live",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-27T21:01:35Z"
        },
        {
          "description": "Archival source code of the Butterfly Fractal Generator for Atari ST",
          "forks_count": 0,
          "language": null,
          "name": "butterfly",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-26T20:39:28Z"
        },
        {
          "description": "Build box for Node >=8 with older versions of gcc and g++.",
          "forks_count": 0,
          "language": null,
          "name": "holy-node-box",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-23T09:26:12Z"
        },
        {
          "description": "Node.js JavaScript runtime ✨🐢🚀✨",
          "forks_count": 0,
          "language": "JavaScript",
          "name": "node",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-22T13:09:45Z"
        },
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": null,
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-11-17T11:52:54Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Nunjucks",
        "JavaScript"
      ],
      "recent_activity": {
        "recent_events": 99,
        "event_breakdown": [
          {
            "count": 12,
            "type": "CreateEvent"
          },
          {
            "count": 11,
            "type": "DeleteEvent"
          },
          {
            "count": 3,
            "type": "IssueCommentEvent"
          },
          {
            "count": 30,
            "type": "PullRequestEvent"
          },
          {
            "count": 5,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 5,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 33,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:29.200Z"
    },
    {
      "handle": "bdemers",
      "name": "Brian Demers",
      "github_id": 99954,
      "display_name": "Brian Demers",
      "avatar_url": "https://avatars.githubusercontent.com/u/99954?v=4",
      "bio": null,
      "company": "@Gradle ",
      "location": "New Hampshire",
      "blog": "https://blog.bdemers.io",
      "twitter_username": null,
      "public_repos": 188,
      "public_gists": 21,
      "followers": 191,
      "following": 2,
      "hireable": null,
      "created_at": "2009-06-29T12:52:13Z",
      "updated_at": "2025-10-29T14:08:09Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "testcontainers-cloud-java-example",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-18T21:15:52Z"
        },
        {
          "description": "Scalable, reliable, distributed storage system optimized for data analytics and object store workloads.",
          "forks_count": 0,
          "language": null,
          "name": "ozone",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-14T15:31:56Z"
        },
        {
          "description": "Apache Polaris, the interoperable, open source catalog for Apache Iceberg",
          "forks_count": 0,
          "language": null,
          "name": "polaris",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-13T18:48:59Z"
        },
        {
          "description": "Apache Solr open-source search software",
          "forks_count": 0,
          "language": null,
          "name": "solr",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-06T16:31:59Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "maven4-non-default-parent-path",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-04-25T15:06:05Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [],
      "recent_activity": {
        "recent_events": 53,
        "event_breakdown": [
          {
            "count": 6,
            "type": "CreateEvent"
          },
          {
            "count": 12,
            "type": "DeleteEvent"
          },
          {
            "count": 12,
            "type": "IssueCommentEvent"
          },
          {
            "count": 6,
            "type": "PullRequestEvent"
          },
          {
            "count": 17,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:12.471Z"
    },
    {
      "handle": "henri-tremblay",
      "name": "Henri Tremblay",
      "github_id": 1216819,
      "display_name": "Henri Tremblay",
      "avatar_url": "https://avatars.githubusercontent.com/u/1216819?v=4",
      "bio": "Java Champion. Leads EasyMock and Objenesis and contributes to Ehcache. Loves optimization and productivity. In Java and in general. Likes to be useful. ",
      "company": "TS Imagine",
      "location": "Montréal, Québec, Canada",
      "blog": "http://blog.tremblay.pro/",
      "twitter_username": null,
      "public_repos": 153,
      "public_gists": 5,
      "followers": 186,
      "following": 1,
      "hireable": true,
      "created_at": "2011-11-23T23:05:34Z",
      "updated_at": "2026-01-26T21:44:42Z",
      "top_repos": [
        {
          "description": "Error Prone extensions: extra bug checkers and a large battery of Refaster rules.",
          "forks_count": 0,
          "language": null,
          "name": "error-prone-support",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-23T14:27:07Z"
        },
        {
          "description": "Example docker files and other collateral for bootstrapping mass-ingest of LSTs for use with Moderne",
          "forks_count": 0,
          "language": null,
          "name": "mass-ingest-example",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-06-10T15:43:34Z"
        },
        {
          "description": "External configuration (server and client) for Spring Cloud",
          "forks_count": 0,
          "language": null,
          "name": "spring-cloud-config",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-06-06T03:22:16Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "Raising-Young-Coders",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-04-29T00:38:15Z"
        },
        {
          "description": "Apache Geode",
          "forks_count": 0,
          "language": null,
          "name": "geode",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-04-21T11:53:43Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [],
      "recent_activity": {
        "recent_events": 92,
        "event_breakdown": [
          {
            "count": 18,
            "type": "DeleteEvent"
          },
          {
            "count": 1,
            "type": "IssueCommentEvent"
          },
          {
            "count": 9,
            "type": "IssuesEvent"
          },
          {
            "count": 5,
            "type": "PullRequestEvent"
          },
          {
            "count": 58,
            "type": "PushEvent"
          },
          {
            "count": 1,
            "type": "ReleaseEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:31.018Z"
    },
    {
      "handle": "bokmann",
      "name": "David Bock",
      "github_id": 57926,
      "display_name": "David Bock",
      "avatar_url": "https://avatars.githubusercontent.com/u/57926?v=4",
      "bio": "VP Strategic Development at Core4ce, Director of Loudoun Computer Science Initiative.  I try to write code, teach, and learn something every day. He/Him.",
      "company": "@loudouncodes",
      "location": "Hamilton, VA",
      "blog": "http://LoudounCodes.org",
      "twitter_username": "bokmann",
      "public_repos": 47,
      "public_gists": 32,
      "followers": 171,
      "following": 9,
      "hireable": true,
      "created_at": "2009-02-25T18:48:45Z",
      "updated_at": "2025-12-26T22:13:46Z",
      "top_repos": [
        {
          "description": "This is a prototype for a chess program I finished senior year of high school in Spring 2022 using java in eclipse. There are two game modes. One is a fully functional two player game mode. The second is one player versus a primitive chess bot. The bot can only play random moves. All chess rules and promotions are implemented.",
          "forks_count": 0,
          "language": null,
          "name": "chess-program",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-12-18T19:25:33Z"
        },
        {
          "description": "Easy-to-use pub/sub built on AWS. Ruby.",
          "forks_count": 0,
          "language": null,
          "name": "propono",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2022-01-19T19:29:25Z"
        },
        {
          "description": "RTanque is a game for (Ruby) programmers. Players program the brain of a tank and then send their tank+brain into battle against other tanks.",
          "forks_count": 0,
          "language": null,
          "name": "RTanque",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2022-03-14T00:15:04Z"
        },
        {
          "description": "Rails website to manage the unmanaged books",
          "forks_count": 0,
          "language": "Ruby",
          "name": "Book_Mangagement",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2022-02-08T04:26:40Z"
        },
        {
          "description": "🍻 Default formulae for the missing package manager for macOS (or Linux)",
          "forks_count": 0,
          "language": null,
          "name": "homebrew-core",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2022-01-28T14:51:54Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Ruby"
      ],
      "recent_activity": {
        "recent_events": 0,
        "event_breakdown": []
      },
      "fetched_at": "2026-01-30T16:23:01.632Z"
    },
    {
      "handle": "FDelporte",
      "name": "Frank Delporte",
      "github_id": 1415873,
      "display_name": "Frank Delporte",
      "avatar_url": "https://avatars.githubusercontent.com/u/1415873?v=4",
      "bio": "#JavaOnRaspberryPi - Java Champion - Author of 'Getting Started with Java on Raspberry Pi' - Technical Writer Azul - Team member Pi4J - CoderDojo Belgium",
      "company": "webtechie.be - Pi4J - CoderDojo",
      "location": "Belgium",
      "blog": "https://webtechie.be/",
      "twitter_username": "FrankDelporte",
      "public_repos": 81,
      "public_gists": 5,
      "followers": 163,
      "following": 26,
      "hireable": null,
      "created_at": "2012-02-07T12:24:09Z",
      "updated_at": "2025-12-13T06:41:17Z",
      "top_repos": [
        {
          "description": "The Candidates service that under-girds SDKMAN! CLI.",
          "forks_count": 0,
          "language": null,
          "name": "sdkman-candidates",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-08T15:32:00Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Kotlin",
          "name": "KotlinGameSnakeApp",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-03T07:52:26Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "sdkman-disco-integration",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-16T20:50:57Z"
        },
        {
          "description": "AudioClip latency on macOS",
          "forks_count": 0,
          "language": "Java",
          "name": "fx-sound-latency-macos",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-06-10T14:06:07Z"
        },
        {
          "description": "Arm Learning Paths: a repository of how-to content for software developers",
          "forks_count": 0,
          "language": null,
          "name": "arm-learning-paths",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-04-23T10:21:36Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Kotlin",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 100,
        "event_breakdown": [
          {
            "count": 2,
            "type": "CreateEvent"
          },
          {
            "count": 2,
            "type": "DeleteEvent"
          },
          {
            "count": 9,
            "type": "IssueCommentEvent"
          },
          {
            "count": 9,
            "type": "IssuesEvent"
          },
          {
            "count": 7,
            "type": "PullRequestEvent"
          },
          {
            "count": 6,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 12,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 53,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:10.985Z"
    },
    {
      "handle": "mlvandijk",
      "name": "Marit van Dijk",
      "github_id": 20927578,
      "display_name": "Marit van Dijk",
      "avatar_url": "https://avatars.githubusercontent.com/u/20927578?v=4",
      "bio": "Java Champion | Developer Advocate | Software Engineer",
      "company": "JetBrains",
      "location": "Amstelveen",
      "blog": "https://maritvandijk.com/",
      "twitter_username": "MaritvanDijk77",
      "public_repos": 60,
      "public_gists": 0,
      "followers": 161,
      "following": 110,
      "hireable": null,
      "created_at": "2016-08-09T12:45:27Z",
      "updated_at": "2026-01-09T12:47:29Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "coding-assistant-comparison",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-07-08T15:37:51Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Kotlin",
          "name": "progress-bar-pl",
          "open_issues_count": 10,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-03T14:05:17Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "bookmarks",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-05-12T19:20:55Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "tdd-ai-examples",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-03-14T14:28:25Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "tdd-with-junie",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-02-27T14:52:38Z"
        }
      ],
      "top_repos_stars": 1,
      "top_repos_forks": 0,
      "languages": [
        "Kotlin",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 62,
        "event_breakdown": [
          {
            "count": 9,
            "type": "CreateEvent"
          },
          {
            "count": 7,
            "type": "DeleteEvent"
          },
          {
            "count": 3,
            "type": "IssueCommentEvent"
          },
          {
            "count": 1,
            "type": "IssuesEvent"
          },
          {
            "count": 1,
            "type": "MemberEvent"
          },
          {
            "count": 20,
            "type": "PullRequestEvent"
          },
          {
            "count": 1,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 1,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 18,
            "type": "PushEvent"
          },
          {
            "count": 1,
            "type": "WatchEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:14.961Z"
    },
    {
      "handle": "bsbodden",
      "name": "Brian Sam-Bodden",
      "github_id": 24109,
      "display_name": "Brian Sam-Bodden",
      "avatar_url": "https://avatars.githubusercontent.com/u/24109?v=4",
      "bio": "🥑 Technologist, Author and Entrepreneur. Principal Applied AI Engineer. Ex-DevRel at Redis. @Java_Champions",
      "company": "@redis",
      "location": "Scottsdale, Arizona",
      "blog": "http://redis.com",
      "twitter_username": "bsbodden",
      "public_repos": 168,
      "public_gists": 30,
      "followers": 161,
      "following": 64,
      "hireable": null,
      "created_at": "2008-09-11T07:32:45Z",
      "updated_at": "2025-12-06T21:20:11Z",
      "top_repos": [
        {
          "description": "LlamaIndex is the leading framework for building LLM-powered agents over your data.",
          "forks_count": 0,
          "language": null,
          "name": "llama_index",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-11T15:28:17Z"
        },
        {
          "description": "The \"Drake Equation\" for static code quality analysis",
          "forks_count": 1,
          "language": "Python",
          "name": "mfcqi",
          "open_issues_count": 1,
          "stargazers_count": 2,
          "topics": [],
          "updated_at": "2025-10-27T17:51:23Z"
        },
        {
          "description": "Native OpenAI Agents SDK session management implementation using Redis as the persistence layer.",
          "forks_count": 0,
          "language": null,
          "name": "openai-agents-redis",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-26T13:53:11Z"
        },
        {
          "description": "Framework to build resilient language agents as graphs.",
          "forks_count": 0,
          "language": "TypeScript",
          "name": "langgraphjs",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-02T20:02:24Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "java-ai-playground",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-05-21T08:43:29Z"
        }
      ],
      "top_repos_stars": 2,
      "top_repos_forks": 1,
      "languages": [
        "Python",
        "TypeScript"
      ],
      "recent_activity": {
        "recent_events": 84,
        "event_breakdown": [
          {
            "count": 7,
            "type": "CreateEvent"
          },
          {
            "count": 2,
            "type": "DeleteEvent"
          },
          {
            "count": 1,
            "type": "GollumEvent"
          },
          {
            "count": 7,
            "type": "IssueCommentEvent"
          },
          {
            "count": 7,
            "type": "IssuesEvent"
          },
          {
            "count": 1,
            "type": "PublicEvent"
          },
          {
            "count": 18,
            "type": "PullRequestEvent"
          },
          {
            "count": 6,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 9,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 24,
            "type": "PushEvent"
          },
          {
            "count": 2,
            "type": "ReleaseEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:16.917Z"
    },
    {
      "handle": "ntschutta",
      "name": "Nate Schutta",
      "github_id": 66812,
      "display_name": "Nate Schutta",
      "avatar_url": "https://avatars.githubusercontent.com/u/66812?v=4",
      "bio": "Nathaniel T. Schutta is a software architect and Java Champion focused on cloud computing, developer happiness and building usable applications",
      "company": "Thoughtworks",
      "location": "Minnesota",
      "blog": "https://ntschutta.io",
      "twitter_username": null,
      "public_repos": 30,
      "public_gists": 0,
      "followers": 160,
      "following": 11,
      "hireable": null,
      "created_at": "2009-03-25T02:15:29Z",
      "updated_at": "2026-01-20T18:00:59Z",
      "top_repos": [
        {
          "description": "Exercise: Introduction to GitHub",
          "forks_count": 0,
          "language": null,
          "name": "skills-introduction-to-github",
          "open_issues_count": 1,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-07-31T16:47:41Z"
        },
        {
          "description": "Exercise: Secure your Repository Supply Chain",
          "forks_count": 0,
          "language": "C#",
          "name": "skills-secure-repository-supply-chain",
          "open_issues_count": 12,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-07-28T17:07:25Z"
        },
        {
          "description": "Exercise: Get started using GitHub Copilot",
          "forks_count": 0,
          "language": "Python",
          "name": "skills-getting-started-with-github-copilot",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-07-11T19:57:25Z"
        },
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": null,
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-01-19T19:57:03Z"
        },
        {
          "description": "So you think you can OSS ",
          "forks_count": 0,
          "language": "Java",
          "name": "spring-cloud-task",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2022-10-29T18:09:02Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "C#",
        "Python",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 0,
        "event_breakdown": []
      },
      "fetched_at": "2026-01-30T16:24:22.405Z"
    },
    {
      "handle": "noctarius",
      "name": "Christoph Engelbert",
      "github_id": 1142801,
      "display_name": "noctarius aka Christoph Engelbert",
      "avatar_url": "https://avatars.githubusercontent.com/u/1142801?v=4",
      "bio": null,
      "company": "Dev Avocado simplyblock.io",
      "location": "Haan, Germany",
      "blog": "https://mastodon.online/@noctarius2k",
      "twitter_username": "noctarius2k",
      "public_repos": 125,
      "public_gists": 15,
      "followers": 148,
      "following": 132,
      "hireable": null,
      "created_at": "2011-10-21T09:36:17Z",
      "updated_at": "2026-01-19T12:55:26Z",
      "top_repos": [
        {
          "description": "The most comprehensive authentication framework for TypeScript",
          "forks_count": 0,
          "language": null,
          "name": "better-auth",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-14T10:52:30Z"
        },
        {
          "description": "The Universal Email API: Build With Templates, Send With Any Provider.",
          "forks_count": 0,
          "language": "TypeScript",
          "name": "mailtura",
          "open_issues_count": 0,
          "stargazers_count": 3,
          "topics": [],
          "updated_at": "2026-01-16T19:32:39Z"
        },
        {
          "description": "Documentation for CSI integration with Kubernetes",
          "forks_count": 0,
          "language": "CSS",
          "name": "kubernetes-csi-docs",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-22T12:09:25Z"
        },
        {
          "description": "Create beautiful applications using Go",
          "forks_count": 0,
          "language": null,
          "name": "wails",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-04T19:10:41Z"
        },
        {
          "description": "An advanced standalone (local-only) dashboard for OpenEMS-based energy solutions",
          "forks_count": 0,
          "language": "Vue",
          "name": "openems-advanced-dashboard",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-04T15:50:25Z"
        }
      ],
      "top_repos_stars": 3,
      "top_repos_forks": 0,
      "languages": [
        "TypeScript",
        "CSS",
        "Vue"
      ],
      "recent_activity": {
        "recent_events": 100,
        "event_breakdown": [
          {
            "count": 6,
            "type": "CreateEvent"
          },
          {
            "count": 9,
            "type": "DeleteEvent"
          },
          {
            "count": 2,
            "type": "IssueCommentEvent"
          },
          {
            "count": 26,
            "type": "IssuesEvent"
          },
          {
            "count": 15,
            "type": "PullRequestEvent"
          },
          {
            "count": 2,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 5,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 35,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:22.155Z"
    },
    {
      "handle": "mgrygles",
      "name": "Mary Grygleski",
      "github_id": 6922279,
      "display_name": "Mary Grygleski",
      "avatar_url": "https://avatars.githubusercontent.com/u/6922279?v=4",
      "bio": "Tech Solutions Architect and Advocate🥑👩‍💻@tech-portico ::::\r\nJava Champion🏆https://javachampions.org :::: AI Collective (Western Hemisphere)",
      "company": "https://maryg.one",
      "location": "Chicago, IL",
      "blog": "",
      "twitter_username": "mgrygles",
      "public_repos": 68,
      "public_gists": 2,
      "followers": 127,
      "following": 49,
      "hireable": null,
      "created_at": "2014-03-11T18:50:55Z",
      "updated_at": "2026-01-15T22:33:28Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "DeepSeek-R1",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2026-01-10T19:44:01Z"
        },
        {
          "description": "Working branch for CodeMash (since 2025)",
          "forks_count": 0,
          "language": null,
          "name": "codemash-session-slides",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-01-20T07:12:00Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Python",
          "name": "test-streamlit-document-qa",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-11-04T17:54:21Z"
        },
        {
          "description": "A list of Java Champions (from aalmiray)",
          "forks_count": 0,
          "language": "CSS",
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-12-04T06:35:51Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "BestOfBothWorlds",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-05-22T05:08:36Z"
        }
      ],
      "top_repos_stars": 1,
      "top_repos_forks": 0,
      "languages": [
        "Python",
        "CSS",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 5,
        "event_breakdown": [
          {
            "count": 5,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:33.564Z"
    },
    {
      "handle": "edeandrea",
      "name": "Eric Deandrea",
      "github_id": 363447,
      "display_name": "Eric Deandrea",
      "avatar_url": "https://avatars.githubusercontent.com/u/363447?v=4",
      "bio": "Java Champion | Sr. Principal Software Engineer (Quarkus & LangChain4j) @ IBM",
      "company": "IBM",
      "location": "Manchester, NH",
      "blog": "https://developers.redhat.com/author/eric-deandrea",
      "twitter_username": "edeandrea",
      "public_repos": 179,
      "public_gists": 17,
      "followers": 125,
      "following": 21,
      "hireable": null,
      "created_at": "2010-08-13T13:20:52Z",
      "updated_at": "2025-11-19T16:28:31Z",
      "top_repos": [
        {
          "description": "Demo of using Docling-java & the Quarkus docling extension.",
          "forks_count": 0,
          "language": "Java",
          "name": "quarkus-docling-demo",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-26T15:17:56Z"
        },
        {
          "description": "Quarkus Langchain4J Workshop",
          "forks_count": 0,
          "language": null,
          "name": "quarkus-workshop-langchain4j",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-16T14:39:11Z"
        },
        {
          "description": "Testcontainers Community Module Registry",
          "forks_count": 0,
          "language": null,
          "name": "community-module-registry",
          "open_issues_count": 1,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-13T20:47:45Z"
        },
        {
          "description": "OpenAPI Generator - REST Client Generator",
          "forks_count": 0,
          "language": "Java",
          "name": "quarkus-openapi-generator",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-14T16:05:25Z"
        },
        {
          "description": "Docling simplifies document processing, parsing diverse formats — including advanced PDF understanding — and providing seamless integrations with the gen AI ecosystem",
          "forks_count": 0,
          "language": "Java",
          "name": "quarkus-docling",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-01T21:16:38Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 100,
        "event_breakdown": [
          {
            "count": 6,
            "type": "CreateEvent"
          },
          {
            "count": 6,
            "type": "DeleteEvent"
          },
          {
            "count": 24,
            "type": "IssueCommentEvent"
          },
          {
            "count": 6,
            "type": "IssuesEvent"
          },
          {
            "count": 1,
            "type": "MemberEvent"
          },
          {
            "count": 10,
            "type": "PullRequestEvent"
          },
          {
            "count": 2,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 4,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 41,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:09.330Z"
    },
    {
      "handle": "Delawen",
      "name": "María Arias de Reyna",
      "github_id": 726590,
      "display_name": "María Arias de Reyna Domínguez",
      "avatar_url": "https://avatars.githubusercontent.com/u/726590?v=4",
      "bio": "Feminist, Geoinquieta, Atheist, crazy of the pussy and Social Justice Warrior. Chaotic good. ",
      "company": "IBM ",
      "location": "Seville",
      "blog": "http://delawen.com",
      "twitter_username": "delawen",
      "public_repos": 91,
      "public_gists": 0,
      "followers": 120,
      "following": 17,
      "hireable": null,
      "created_at": "2011-04-13T08:41:01Z",
      "updated_at": "2026-01-01T12:25:39Z",
      "top_repos": [
        {
          "description": "https://openjdk.org/projects/leyden",
          "forks_count": 0,
          "language": null,
          "name": "leyden-docs",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-30T12:46:41Z"
        },
        {
          "description": "This is a REST wrapper for some of the functions on https://github.com/ionutbalosin/jvm-performance-benchmarks  to be able to benchmark it using http requests.",
          "forks_count": 0,
          "language": "Java",
          "name": "jvm-performance-benchmarks-rest-wrapper",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-26T12:47:51Z"
        },
        {
          "description": "Quarkus: Supersonic Subatomic Java. ",
          "forks_count": 0,
          "language": null,
          "name": "quarkus",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-12T10:44:42Z"
        },
        {
          "description": "Trivial example to showcase Leyden AOT cache usage.",
          "forks_count": 0,
          "language": "Java",
          "name": "bad-good-cache",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-12T11:34:43Z"
        },
        {
          "description": "Perfomance test scripts",
          "forks_count": 0,
          "language": "Shell",
          "name": "leyden-perf-test",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-05T11:14:35Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Java",
        "Shell"
      ],
      "recent_activity": {
        "recent_events": 69,
        "event_breakdown": [
          {
            "count": 5,
            "type": "CreateEvent"
          },
          {
            "count": 21,
            "type": "DeleteEvent"
          },
          {
            "count": 1,
            "type": "ForkEvent"
          },
          {
            "count": 8,
            "type": "IssueCommentEvent"
          },
          {
            "count": 10,
            "type": "PullRequestEvent"
          },
          {
            "count": 23,
            "type": "PushEvent"
          },
          {
            "count": 1,
            "type": "ReleaseEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:22:54.562Z"
    },
    {
      "handle": "kdubois",
      "name": "Kevin Dubois",
      "github_id": 373537,
      "display_name": "Kevin Dubois",
      "avatar_url": "https://avatars.githubusercontent.com/u/373537?v=4",
      "bio": "Sr. Principal Developer Advocate at IBM",
      "company": "IBM",
      "location": "Valais, Switzerland",
      "blog": "https://www.kevindubois.com",
      "twitter_username": null,
      "public_repos": 78,
      "public_gists": 0,
      "followers": 113,
      "following": 16,
      "hireable": null,
      "created_at": "2010-08-23T15:01:57Z",
      "updated_at": "2026-01-28T08:44:32Z",
      "top_repos": [
        {
          "description": "⚖️ The CNCF Technical Oversight Committee (TOC) is the technical governing body of the CNCF Foundation.",
          "forks_count": 0,
          "language": null,
          "name": "toc",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-16T10:38:54Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "rollouts-demo",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-10T13:44:14Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "test-repo",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-10T13:25:16Z"
        },
        {
          "description": "Argo Rollouts metric plugin for AI analysis",
          "forks_count": 0,
          "language": null,
          "name": "rollouts-plugin-metric-ai",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-03T12:52:34Z"
        },
        {
          "description": "An autonomous AI agent for Kubernetes debugging and remediation, powered by Quarkus LangChain4j and Gemini AI.",
          "forks_count": 0,
          "language": "Java",
          "name": "kubernetes-agent",
          "open_issues_count": 1,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-11-17T11:29:05Z"
        }
      ],
      "top_repos_stars": 1,
      "top_repos_forks": 0,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 100,
        "event_breakdown": [
          {
            "count": 14,
            "type": "CreateEvent"
          },
          {
            "count": 12,
            "type": "DeleteEvent"
          },
          {
            "count": 4,
            "type": "IssueCommentEvent"
          },
          {
            "count": 27,
            "type": "PullRequestEvent"
          },
          {
            "count": 3,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 40,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:18.085Z"
    },
    {
      "handle": "ionutbalosin",
      "name": "Ionut Balosin",
      "github_id": 42312997,
      "display_name": "Ionut Balosin",
      "avatar_url": "https://avatars.githubusercontent.com/u/42312997?v=4",
      "bio": "👨‍💻 Principal IT Architect • 🎓 Technical Trainer • 🏆 Java Champion • ♠️ Oracle ACE Associate • 🔑 Security Champion • 🎤 Speaker • ✍️ Blogger",
      "company": "www.ionutbalosin.com",
      "location": "Vienna, Austria",
      "blog": "www.ionutbalosin.com",
      "twitter_username": "ionutbalosin",
      "public_repos": 6,
      "public_gists": 0,
      "followers": 101,
      "following": 1,
      "hireable": null,
      "created_at": "2018-08-12T07:57:08Z",
      "updated_at": "2026-01-02T14:36:18Z",
      "top_repos": [
        {
          "description": "Application security best practices and code implementations for Java developers. This project is intended for didactic purposes only, supporting my training course.",
          "forks_count": 12,
          "language": "Java",
          "name": "java-application-security-practices",
          "open_issues_count": 0,
          "stargazers_count": 62,
          "topics": [
            "api-security",
            "authorization-code-flow",
            "authorization-code-flow-with-pkce",
            "client-credentials-flow",
            "cors",
            "csp",
            "dast",
            "java-process-security",
            "json-web-key-set",
            "jwks",
            "oauth-grant-types",
            "password-flow",
            "roles-based-access-control",
            "sast",
            "sca",
            "security-design-principles",
            "security-logging",
            "security-testing",
            "token-introspection"
          ],
          "updated_at": "2025-12-31T07:47:35Z"
        },
        {
          "description": "Java Virtual Machine (JVM) benchmarks to measure the energy consumption under different loads and with different available off-the-shelf applications.",
          "forks_count": 1,
          "language": "Java",
          "name": "jvm-energy-consumption",
          "open_issues_count": 0,
          "stargazers_count": 24,
          "topics": [
            "energy",
            "energy-consumption",
            "graalvm",
            "graalvm-native-image",
            "jvm",
            "linux",
            "macos",
            "openj9",
            "openjdk",
            "perf",
            "powermetrics",
            "powerstat",
            "rapl",
            "running-average-power-limit"
          ],
          "updated_at": "2025-12-29T09:47:11Z"
        },
        {
          "description": "Java Virtual Machine (JVM) Performance Benchmarks with a primary focus on top-tier Just-In-Time (JIT) Compilers, such as C2 JIT, Graal JIT, and the Falcon JIT.",
          "forks_count": 15,
          "language": "Java",
          "name": "jvm-performance-benchmarks",
          "open_issues_count": 2,
          "stargazers_count": 131,
          "topics": [
            "benchmark",
            "compiler",
            "graalvm",
            "jit",
            "jmh",
            "jmh-benchmarks",
            "just-in-time",
            "openjdk",
            "performance"
          ],
          "updated_at": "2026-01-15T15:34:15Z"
        },
        {
          "description": "eCommerce application is a platform where customers can find products, shop around using a cart, check out the products and initiate payments. It is used for the didactic purpose only, as a support project for my training.",
          "forks_count": 39,
          "language": "Java",
          "name": "ecommerce-app",
          "open_issues_count": 1,
          "stargazers_count": 130,
          "topics": [
            "api-driven-development",
            "asynchronous-logging",
            "avro",
            "caching",
            "debezium",
            "docker",
            "event-driven",
            "flywaydb",
            "kafka",
            "location-decoupling",
            "microservices",
            "openapi",
            "postgresql",
            "resilience",
            "resilience4j",
            "scalability",
            "schema-first-approach",
            "shared-nothing-database-approach",
            "spring-boot",
            "testcontainers"
          ],
          "updated_at": "2025-12-29T10:33:19Z"
        },
        {
          "description": "App/Dynamic CDS, Shared Class Cache SCC, Ahead-of-Time AOT, OpenJDK HotSpot, Eclipse OpenJ9, Graal VM native-image",
          "forks_count": 7,
          "language": "Shell",
          "name": "faster-jvm-start-up-techniques",
          "open_issues_count": 0,
          "stargazers_count": 54,
          "topics": [
            "appcds",
            "cds",
            "dynamiccds",
            "graalvm-native-image",
            "hotspot-jvm",
            "jvm",
            "openj9"
          ],
          "updated_at": "2026-01-06T13:00:46Z"
        }
      ],
      "top_repos_stars": 401,
      "top_repos_forks": 74,
      "languages": [
        "Java",
        "Shell"
      ],
      "recent_activity": {
        "recent_events": 13,
        "event_breakdown": [
          {
            "count": 1,
            "type": "CreateEvent"
          },
          {
            "count": 6,
            "type": "DeleteEvent"
          },
          {
            "count": 3,
            "type": "IssueCommentEvent"
          },
          {
            "count": 2,
            "type": "PullRequestEvent"
          },
          {
            "count": 1,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:22:55.689Z"
    },
    {
      "handle": "cjudd",
      "name": "Christopher Judd",
      "github_id": 43936,
      "display_name": "Christopher M. Judd",
      "avatar_url": "https://avatars.githubusercontent.com/u/43936?v=4",
      "bio": "Trusted Technical Advisor, Talent Developer, Chief Technical Officer (CTO) and Partner at Manifest Solutions, Java Champion, Author, Speaker, Consultant",
      "company": "Manifest Solutions",
      "location": "Columbus Ohio",
      "blog": "http://www.juddsolutions.com",
      "twitter_username": null,
      "public_repos": 86,
      "public_gists": 1,
      "followers": 94,
      "following": 2,
      "hireable": null,
      "created_at": "2009-01-03T13:46:16Z",
      "updated_at": "2026-01-13T19:13:06Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "session-slides",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-15T16:25:38Z"
        },
        {
          "description": "Invisible Technology: Hacking with Infrared Workshop",
          "forks_count": 0,
          "language": "C++",
          "name": "hacking-infrared-workshop",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-24T16:38:02Z"
        },
        {
          "description": "AWS Distro for OpenTelemetry Example",
          "forks_count": 0,
          "language": null,
          "name": "spring-petclinic-aws-collector",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-06-12T21:33:54Z"
        },
        {
          "description": "Hands-on workshop for creating a Classic Legend of Zelda clone for Codemash.",
          "forks_count": 0,
          "language": null,
          "name": "thelegendofcodemash-workshop",
          "open_issues_count": 0,
          "stargazers_count": 2,
          "topics": [],
          "updated_at": "2024-05-29T18:24:55Z"
        },
        {
          "description": "🍃 JavaScript library for mobile-friendly interactive maps 🇺🇦",
          "forks_count": 0,
          "language": null,
          "name": "Leaflet",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-11-03T20:11:52Z"
        }
      ],
      "top_repos_stars": 2,
      "top_repos_forks": 0,
      "languages": [
        "C++"
      ],
      "recent_activity": {
        "recent_events": 35,
        "event_breakdown": [
          {
            "count": 1,
            "type": "CreateEvent"
          },
          {
            "count": 1,
            "type": "ForkEvent"
          },
          {
            "count": 2,
            "type": "PullRequestEvent"
          },
          {
            "count": 31,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:44.084Z"
    },
    {
      "handle": "patbaumgartner",
      "name": "Patrick Baumgartner",
      "github_id": 406780,
      "display_name": "Patrick Baumgartner",
      "avatar_url": "https://avatars.githubusercontent.com/u/406780?v=4",
      "bio": "Passionate Software Crafter and life long learner.",
      "company": "42talents GmbH",
      "location": "Switzerland",
      "blog": "http://patbaumgartner.com",
      "twitter_username": "patbaumgartner",
      "public_repos": 63,
      "public_gists": 2,
      "followers": 89,
      "following": 59,
      "hireable": true,
      "created_at": "2010-09-19T07:31:39Z",
      "updated_at": "2026-01-28T12:26:46Z",
      "top_repos": [
        {
          "description": "Ticket-Triage-Agent for an internal support or ITSM system",
          "forks_count": 0,
          "language": "Java",
          "name": "embabel-entwickler.de",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-25T16:04:11Z"
        },
        {
          "description": "Buildpacks Unpacked: Hacking Spring Boot Builds with Custom AOT Caching",
          "forks_count": 0,
          "language": null,
          "name": "talk-buildpacks-unpacked-custom-aot-caching",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-16T17:58:39Z"
        },
        {
          "description": "Spring Boot Observability in Practice: Actuator, Micrometer, and OpenTelemetry",
          "forks_count": 0,
          "language": null,
          "name": "talk-spring-boot-observability-in-practice",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-05T15:36:05Z"
        },
        {
          "description": "Spring Boot in the Cloud: Advanced Optimization Deep Dive",
          "forks_count": 1,
          "language": null,
          "name": "deep-dive-spring-boot-in-the-cloud",
          "open_issues_count": 0,
          "stargazers_count": 3,
          "topics": [],
          "updated_at": "2025-11-26T11:08:00Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "C#",
          "name": "SoCraTesAT-2025",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-28T10:42:36Z"
        }
      ],
      "top_repos_stars": 3,
      "top_repos_forks": 1,
      "languages": [
        "Java",
        "C#"
      ],
      "recent_activity": {
        "recent_events": 36,
        "event_breakdown": [
          {
            "count": 1,
            "type": "CreateEvent"
          },
          {
            "count": 1,
            "type": "DeleteEvent"
          },
          {
            "count": 1,
            "type": "IssueCommentEvent"
          },
          {
            "count": 7,
            "type": "IssuesEvent"
          },
          {
            "count": 1,
            "type": "PullRequestEvent"
          },
          {
            "count": 25,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:22:56.842Z"
    },
    {
      "handle": "icougil",
      "name": "Nacho Cougil",
      "github_id": 2370634,
      "display_name": "Nacho Cougil",
      "avatar_url": "https://avatars.githubusercontent.com/u/2370634?v=4",
      "bio": "Principal Software engineer at Dynatrace. \r\nFounder of @barcelonajug & @JBCNConf \r\nInterested in learning, specially in Java/JVM stuff, forensics. XP fan ❤️",
      "company": "@Dynatrace",
      "location": "Barcelona",
      "blog": "http://nacho.cougil.com",
      "twitter_username": "icougil",
      "public_repos": 102,
      "public_gists": 0,
      "followers": 72,
      "following": 51,
      "hireable": null,
      "created_at": "2012-09-18T14:11:48Z",
      "updated_at": "2026-01-14T15:33:44Z",
      "top_repos": [
        {
          "description": "My JSONs repository",
          "forks_count": 0,
          "language": null,
          "name": "jsons",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-15T22:17:27Z"
        },
        {
          "description": "developers.events is a community-driven platform listing developer/tech conferences and Calls for Papers (CFPs) worldwide with a list, a calendar and a map view. It helps organizers, speakers, sponsors & attendees.",
          "forks_count": 0,
          "language": null,
          "name": "developers-conferences-agenda",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-15T23:52:33Z"
        },
        {
          "description": "World Wide JUGs - List of Java User Groups around the world",
          "forks_count": 0,
          "language": null,
          "name": "GlobalWWJugs",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-24T15:05:46Z"
        },
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": "CSS",
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-12-02T22:51:51Z"
        },
        {
          "description": "Test-Driven Java Development – Second Edition, published by Packt",
          "forks_count": 0,
          "language": null,
          "name": "Test-Driven-Java-Development-Second-Edition",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2021-10-04T20:46:50Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "CSS"
      ],
      "recent_activity": {
        "recent_events": 11,
        "event_breakdown": [
          {
            "count": 1,
            "type": "ForkEvent"
          },
          {
            "count": 2,
            "type": "IssueCommentEvent"
          },
          {
            "count": 3,
            "type": "IssuesEvent"
          },
          {
            "count": 2,
            "type": "PushEvent"
          },
          {
            "count": 3,
            "type": "WatchEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:05.523Z"
    },
    {
      "handle": "cayhorstmann",
      "name": "Dr. Cay Horstmann",
      "github_id": 432187,
      "display_name": null,
      "avatar_url": "https://avatars.githubusercontent.com/u/432187?v=4",
      "bio": null,
      "company": null,
      "location": null,
      "blog": "",
      "twitter_username": null,
      "public_repos": 24,
      "public_gists": 2,
      "followers": 68,
      "following": 0,
      "hireable": null,
      "created_at": "2010-10-08T09:56:28Z",
      "updated_at": "2026-01-26T05:20:41Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": "HTML",
          "name": "streams-below-the-surface",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-29T16:52:06Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "adventofcode2025",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-12T05:54:50Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "jcrete2025",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-12T14:26:29Z"
        },
        {
          "description": "Exec Maven Plugin",
          "forks_count": 0,
          "language": "Java",
          "name": "exec-maven-plugin",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-23T17:29:38Z"
        },
        {
          "description": "CodeCheck is an anonymous, author-friendly autograder. It is optimized for simple programming assignments that provide practice and build confidence. This is the third generation of the project.",
          "forks_count": 4,
          "language": "Java",
          "name": "codecheck3",
          "open_issues_count": 5,
          "stargazers_count": 4,
          "topics": [],
          "updated_at": "2025-12-10T19:30:56Z"
        }
      ],
      "top_repos_stars": 4,
      "top_repos_forks": 4,
      "languages": [
        "HTML",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 2,
        "event_breakdown": [
          {
            "count": 1,
            "type": "CreateEvent"
          },
          {
            "count": 1,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:41.216Z"
    },
    {
      "handle": "jpbempel",
      "name": "Jean-Philippe Bempel",
      "github_id": 4610701,
      "display_name": "Jean-Philippe Bempel",
      "avatar_url": "https://avatars.githubusercontent.com/u/4610701?v=4",
      "bio": "Sr Sw Eng@Datadog\r\nPassionate on performance topics & mechanical sympathy supporter.\r\nJava Champion &\r\nJDK Mission Control committer\r\n@jpbempel@mastodon.online",
      "company": "Datadog",
      "location": "Paris",
      "blog": "jpbempel.github.io",
      "twitter_username": "jpbempel",
      "public_repos": 34,
      "public_gists": 43,
      "followers": 66,
      "following": 0,
      "hireable": null,
      "created_at": "2013-06-04T11:57:34Z",
      "updated_at": "2025-11-14T10:57:19Z",
      "top_repos": [
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": null,
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-12-01T08:18:04Z"
        },
        {
          "description": "JDK main-line development",
          "forks_count": 0,
          "language": "Java",
          "name": "jdk",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-24T16:27:52Z"
        },
        {
          "description": "JFR file tool",
          "forks_count": 0,
          "language": "Java",
          "name": "jfr-tool",
          "open_issues_count": 0,
          "stargazers_count": 4,
          "topics": [],
          "updated_at": "2024-05-19T00:17:47Z"
        },
        {
          "description": "https://openjdk.java.net/projects/jmc/",
          "forks_count": 0,
          "language": "Java",
          "name": "jmc",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2022-01-10T09:26:02Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "richardstartin.github.io",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2020-05-02T20:52:09Z"
        }
      ],
      "top_repos_stars": 4,
      "top_repos_forks": 0,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 100,
        "event_breakdown": [
          {
            "count": 10,
            "type": "CreateEvent"
          },
          {
            "count": 7,
            "type": "DeleteEvent"
          },
          {
            "count": 3,
            "type": "IssueCommentEvent"
          },
          {
            "count": 1,
            "type": "IssuesEvent"
          },
          {
            "count": 39,
            "type": "PullRequestEvent"
          },
          {
            "count": 10,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 11,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 19,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:22:59.303Z"
    },
    {
      "handle": "hannotify",
      "name": "Hanno Embregts",
      "github_id": 11613148,
      "display_name": "Hanno Embregts",
      "avatar_url": "https://avatars.githubusercontent.com/u/11613148?v=4",
      "bio": "Hanno Embregts is a Java Developer, Speaker and Teacher at Info Support (the Netherlands).",
      "company": "@infosupport",
      "location": "Leusden, the Netherlands",
      "blog": "https://hanno.codes",
      "twitter_username": "hannotify",
      "public_repos": 49,
      "public_gists": 0,
      "followers": 62,
      "following": 12,
      "hireable": null,
      "created_at": "2015-03-23T12:51:56Z",
      "updated_at": "2026-01-05T15:31:30Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": "CSS",
          "name": "http-how-teenagers-talk-to-their-parents",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-04T17:37:29Z"
        },
        {
          "description": "Slide deck for my conference talk \"From Zero to Secured: Live-Coding a Full-Stack Jakarta EE REST App with MicroProfile and JWT Authentication\".",
          "forks_count": 0,
          "language": "HTML",
          "name": "from-zero-to-secured",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-07-09T08:23:04Z"
        },
        {
          "description": "A Jakarta EE RESTful application that can keep track of Formula 1 results and standings",
          "forks_count": 1,
          "language": "Java",
          "name": "gravel-trapp",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-06-05T12:28:37Z"
        },
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": "CSS",
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-07-09T08:23:32Z"
        },
        {
          "description": "Backup list for my friendly Java bubble",
          "forks_count": 0,
          "language": "Java",
          "name": "javabubble",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-11-18T11:01:46Z"
        }
      ],
      "top_repos_stars": 3,
      "top_repos_forks": 1,
      "languages": [
        "CSS",
        "HTML",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 7,
        "event_breakdown": [
          {
            "count": 2,
            "type": "PullRequestEvent"
          },
          {
            "count": 5,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:20.550Z"
    },
    {
      "handle": "kito99",
      "name": "Kito Mann",
      "github_id": 3187538,
      "display_name": "Kito D. Mann",
      "avatar_url": "https://avatars.githubusercontent.com/u/3187538?v=4",
      "bio": "Architecture, training, development, and mentoring with Jakarta EE, JSF, Web Components, Microservices, etc.",
      "company": "Virtua, Inc.",
      "location": "Glen Allen, VA",
      "blog": "https://virtua.tech",
      "twitter_username": null,
      "public_repos": 69,
      "public_gists": 0,
      "followers": 57,
      "following": 14,
      "hireable": true,
      "created_at": "2013-01-04T18:00:54Z",
      "updated_at": "2026-01-08T22:07:16Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "session-slides",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-16T21:36:01Z"
        },
        {
          "description": "microprofile-graphql",
          "forks_count": 0,
          "language": null,
          "name": "microprofile-graphql",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-07-03T01:51:17Z"
        },
        {
          "description": "Root repo for building the Jakarta EE Tutorial site (from different repos).",
          "forks_count": 0,
          "language": null,
          "name": "jakartaee-documentation",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-10-18T13:33:04Z"
        },
        {
          "description": "The project demonstrates how you can develop applications with Jakarta EE using widely adopted architectural best practices like Domain-Driven Design (DDD).",
          "forks_count": 0,
          "language": null,
          "name": "cargotracker",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-07-21T23:28:08Z"
        },
        {
          "description": "Example of SeBootstrap",
          "forks_count": 0,
          "language": null,
          "name": "RestSeBootstrapJakarataEETutorial",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-01-19T01:00:15Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [],
      "recent_activity": {
        "recent_events": 3,
        "event_breakdown": [
          {
            "count": 1,
            "type": "ForkEvent"
          },
          {
            "count": 1,
            "type": "PullRequestEvent"
          },
          {
            "count": 1,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:53.971Z"
    },
    {
      "handle": "mpredli01",
      "name": "Michael P. Redlich",
      "github_id": 4043260,
      "display_name": "Michael Redlich",
      "avatar_url": "https://avatars.githubusercontent.com/u/4043260?v=4",
      "bio": "Java Champion | Director at Garden State JUG | Lead Java Editor at InfoQ Java | Contract Developer Advocate and Technical Writer at Payara",
      "company": null,
      "location": "Flemington, NJ",
      "blog": "https://redlich.net/",
      "twitter_username": "mpredli",
      "public_repos": 81,
      "public_gists": 0,
      "followers": 57,
      "following": 26,
      "hireable": null,
      "created_at": "2013-04-03T01:44:16Z",
      "updated_at": "2026-01-08T16:46:58Z",
      "top_repos": [
        {
          "description": "Eclipse Starter for Jakarta EE",
          "forks_count": 0,
          "language": "HTML",
          "name": "starter",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-19T12:12:22Z"
        },
        {
          "description": "Jakartaee Future Directions Interest Group",
          "forks_count": 0,
          "language": null,
          "name": "jakartaee-future-directions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-09T20:45:04Z"
        },
        {
          "description": "A random drawing application to determine a winner of a license to IntelliJ IDEA from a list of attendees",
          "forks_count": 0,
          "language": "Java",
          "name": "random-drawing",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-08-08T15:44:02Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "modern-api-development-with-java",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-06-28T15:50:05Z"
        },
        {
          "description": "Spring Security",
          "forks_count": 0,
          "language": "Java",
          "name": "spring-security",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-04-23T14:35:17Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "HTML",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 57,
        "event_breakdown": [
          {
            "count": 7,
            "type": "CreateEvent"
          },
          {
            "count": 5,
            "type": "DeleteEvent"
          },
          {
            "count": 14,
            "type": "PullRequestEvent"
          },
          {
            "count": 31,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:12.561Z"
    },
    {
      "handle": "mirage22",
      "name": "Miro Wengner",
      "github_id": 1956942,
      "display_name": "Miro Wengner",
      "avatar_url": "https://avatars.githubusercontent.com/u/1956942?v=4",
      "bio": "Software Engineer, OpenJDK contributor, JCP-EC member,  Java Champion  ... co-author of @Robo4J framework ",
      "company": "www.robo4j.io",
      "location": "München",
      "blog": "http://www.wengnermiro.com",
      "twitter_username": null,
      "public_repos": 87,
      "public_gists": 0,
      "followers": 53,
      "following": 22,
      "hireable": null,
      "created_at": "2012-07-11T14:12:05Z",
      "updated_at": "2026-01-11T21:23:31Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "jekyll-pages-example-1",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-04T11:39:58Z"
        },
        {
          "description": "Example usage hugo, for testing",
          "forks_count": 0,
          "language": null,
          "name": "hugo-pages-example-1",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-02T16:24:00Z"
        },
        {
          "description": "Prometheus instrumentation library for JVM applications",
          "forks_count": 0,
          "language": null,
          "name": "client_java",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-12-10T19:00:04Z"
        },
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": "CSS",
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-12-04T11:05:30Z"
        },
        {
          "description": "Repository for important documentation - the index to the project / community",
          "forks_count": 0,
          "language": null,
          "name": "microprofile",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-01-31T12:50:06Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "CSS"
      ],
      "recent_activity": {
        "recent_events": 33,
        "event_breakdown": [
          {
            "count": 3,
            "type": "CreateEvent"
          },
          {
            "count": 2,
            "type": "IssueCommentEvent"
          },
          {
            "count": 12,
            "type": "IssuesEvent"
          },
          {
            "count": 5,
            "type": "PullRequestEvent"
          },
          {
            "count": 3,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 8,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:40.633Z"
    },
    {
      "handle": "lasalazarr",
      "name": "Alberto Salazar",
      "github_id": 9697601,
      "display_name": "Alberto Salazar",
      "avatar_url": "https://avatars.githubusercontent.com/u/9697601?v=4",
      "bio": "Java Champion, Oracle Groundbreaker Ambassador, Auth0 Ambassador, JUG Leader and Java Community Process Member. Founder: @ecuadorjug http://www.javaday.ec",
      "company": "Advance LATAM",
      "location": "Latino America",
      "blog": "https://lasalazarr.github.io/blog/",
      "twitter_username": null,
      "public_repos": 71,
      "public_gists": 0,
      "followers": 51,
      "following": 3,
      "hireable": null,
      "created_at": "2014-11-12T15:12:22Z",
      "updated_at": "2026-01-05T20:51:53Z",
      "top_repos": [
        {
          "description": "Java + AI Talk",
          "forks_count": 0,
          "language": "Java",
          "name": "springboot-tribuo-fraud-detector",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-08T18:47:00Z"
        },
        {
          "description": "Solving Challenges of use Reactive and Non-Reactive Services in the Real World !",
          "forks_count": 0,
          "language": "Java",
          "name": "reactive-non-reactive-services",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-06-02T14:20:09Z"
        },
        {
          "description": "Explanation of the most significant myths to migrate newer version of Java EE now Jakarta EE",
          "forks_count": 0,
          "language": null,
          "name": "jakartaee-myths",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-03-04T01:41:02Z"
        },
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": null,
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2023-12-21T16:02:12Z"
        },
        {
          "description": "Reat Test",
          "forks_count": 0,
          "language": "HTML",
          "name": "test-react",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-11-04T01:14:34Z"
        }
      ],
      "top_repos_stars": 1,
      "top_repos_forks": 0,
      "languages": [
        "Java",
        "HTML"
      ],
      "recent_activity": {
        "recent_events": 0,
        "event_breakdown": []
      },
      "fetched_at": "2026-01-30T16:24:15.066Z"
    },
    {
      "handle": "mvitz",
      "name": "Michael Vitz",
      "github_id": 563587,
      "display_name": "Michael Vitz",
      "avatar_url": "https://avatars.githubusercontent.com/u/563587?v=4",
      "bio": "Java Champion since 2021, working as Senior Consultant @INNOQ",
      "company": "@innoq",
      "location": "Germany",
      "blog": "https://mvitz.de",
      "twitter_username": "michaelvitz",
      "public_repos": 79,
      "public_gists": 9,
      "followers": 43,
      "following": 1,
      "hireable": null,
      "created_at": "2011-01-13T21:55:22Z",
      "updated_at": "2025-12-04T15:09:02Z",
      "top_repos": [
        {
          "description": "Repology backend service to update repository and package data",
          "forks_count": 0,
          "language": null,
          "name": "repology-updater",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-04T08:21:42Z"
        },
        {
          "description": "Home of the Renovate CLI: Cross-platform Dependency Automation by Mend.io",
          "forks_count": 0,
          "language": null,
          "name": "renovate",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-17T13:35:57Z"
        },
        {
          "description": "Examples for my talk about things you can do to surprise others.",
          "forks_count": 0,
          "language": "Java",
          "name": "wat-java-talk",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-17T07:16:02Z"
        },
        {
          "description": "Reproducer for some Alpaquita Node based problems",
          "forks_count": 0,
          "language": "Shell",
          "name": "alpaquita-node",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-06-03T19:09:52Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "actuator-time-to-live",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-05-23T09:42:05Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Java",
        "Shell"
      ],
      "recent_activity": {
        "recent_events": 39,
        "event_breakdown": [
          {
            "count": 19,
            "type": "DeleteEvent"
          },
          {
            "count": 20,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:37.694Z"
    },
    {
      "handle": "rfichtner",
      "name": "Richard Fichtner",
      "github_id": 18716660,
      "display_name": "Richard Fichtner",
      "avatar_url": "https://avatars.githubusercontent.com/u/18716660?v=4",
      "bio": "CEO of XDEV Software,\r\nProgrammer, \r\nLoves Java ❤️☕, \r\n Founder JUG Oberpfalz, \r\nCo-organizer @jcon_conference, \r\nFather and Husband",
      "company": "XDEV Software",
      "location": "BY, Germany",
      "blog": "xdev.software",
      "twitter_username": "RichardFichtner",
      "public_repos": 40,
      "public_gists": 0,
      "followers": 38,
      "following": 8,
      "hireable": null,
      "created_at": "2016-04-28T08:55:53Z",
      "updated_at": "2026-01-30T07:37:05Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "JCON-DB",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-12-16T07:35:31Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "C#",
          "name": "github-actions-workshop",
          "open_issues_count": 1,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-13T13:59:18Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "java-iot",
          "open_issues_count": 1,
          "stargazers_count": 1,
          "topics": [],
          "updated_at": "2025-03-06T21:03:42Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "nanowar-HelloWorld",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-12-05T14:42:10Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "cleancode-demo-db",
          "open_issues_count": 1,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-12-09T14:21:21Z"
        }
      ],
      "top_repos_stars": 1,
      "top_repos_forks": 0,
      "languages": [
        "C#",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 0,
        "event_breakdown": []
      },
      "fetched_at": "2026-01-30T16:23:24.473Z"
    },
    {
      "handle": "sippsack",
      "name": "Falk Sippach",
      "github_id": 413426,
      "display_name": "Falk Sippach",
      "avatar_url": "https://avatars.githubusercontent.com/u/413426?v=4",
      "bio": "Software architect at embarc, former at OIO, co-organizer JUG Darmstadt",
      "company": "@dukecon @jugda @embarced",
      "location": "Darmstadt",
      "blog": "https://twitter.com/sippsack",
      "twitter_username": "sippsack",
      "public_repos": 52,
      "public_gists": 0,
      "followers": 34,
      "following": 5,
      "hireable": null,
      "created_at": "2010-09-23T19:33:33Z",
      "updated_at": "2026-01-02T21:57:14Z",
      "top_repos": [
        {
          "description": "Sternfahrt zur JavaLand 2026",
          "forks_count": 0,
          "language": null,
          "name": "javaland-sternfahrt-2026",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-23T12:20:00Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "JavaScript",
          "name": "coderetreat.org",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-15T21:03:19Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "java25-workshop",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-17T14:37:57Z"
        },
        {
          "description": "Sternfahrt zur JavaLand 2025",
          "forks_count": 0,
          "language": null,
          "name": "javaland-sternfahrt-2025",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-12-16T12:36:54Z"
        },
        {
          "description": "OpenMRS API and web application code",
          "forks_count": 0,
          "language": null,
          "name": "codescene-example-openmrs-core",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-12-09T15:29:01Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "JavaScript",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 9,
        "event_breakdown": [
          {
            "count": 1,
            "type": "MemberEvent"
          },
          {
            "count": 2,
            "type": "PullRequestEvent"
          },
          {
            "count": 2,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 4,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:25.662Z"
    },
    {
      "handle": "jasondlee",
      "name": "Jason Lee",
      "github_id": 191616,
      "display_name": "Jason Lee",
      "avatar_url": "https://avatars.githubusercontent.com/u/191616?v=4",
      "bio": "Christian. Husband. Father. Bassist. Martial Artist. Java Champion. Software engineer @ IBM. OKCJUG President. Opinions are mine, but can be yours.",
      "company": "IBM",
      "location": "Edmond, OK",
      "blog": "https://jasondl.ee",
      "twitter_username": "jasondlee",
      "public_repos": 126,
      "public_gists": 11,
      "followers": 23,
      "following": 1,
      "hireable": null,
      "created_at": "2010-01-28T15:09:08Z",
      "updated_at": "2025-11-06T14:46:18Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": "Kotlin",
          "name": "giftbook-demo",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-22T04:30:25Z"
        },
        {
          "description": "jasondlee calling card",
          "forks_count": 0,
          "language": null,
          "name": "jasondlee-card",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-07T15:22:53Z"
        },
        {
          "description": "Throw away remote ejb project to test Undertow changes",
          "forks_count": 0,
          "language": "Java",
          "name": "remoteejb",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-06T16:03:36Z"
        },
        {
          "description": "Java API for Archive Manipulation",
          "forks_count": 0,
          "language": null,
          "name": "shrinkwrap",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-09-15T16:29:52Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "jbang-catalog",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-10-16T15:09:09Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Kotlin",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 99,
        "event_breakdown": [
          {
            "count": 10,
            "type": "CreateEvent"
          },
          {
            "count": 2,
            "type": "DeleteEvent"
          },
          {
            "count": 3,
            "type": "IssueCommentEvent"
          },
          {
            "count": 3,
            "type": "IssuesEvent"
          },
          {
            "count": 7,
            "type": "PullRequestEvent"
          },
          {
            "count": 5,
            "type": "PullRequestReviewCommentEvent"
          },
          {
            "count": 8,
            "type": "PullRequestReviewEvent"
          },
          {
            "count": 61,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:48.422Z"
    },
    {
      "handle": "benfante",
      "name": "Lucio Benfante",
      "github_id": 134066,
      "display_name": "Lucio Benfante",
      "avatar_url": "https://avatars.githubusercontent.com/u/134066?v=4",
      "bio": null,
      "company": null,
      "location": "Italy",
      "blog": "https://www.benfante.com",
      "twitter_username": "luciobenfante",
      "public_repos": 26,
      "public_gists": 0,
      "followers": 22,
      "following": 6,
      "hireable": null,
      "created_at": "2009-10-02T07:59:19Z",
      "updated_at": "2026-01-02T10:08:56Z",
      "top_repos": [
        {
          "description": "Exercises during my learning of the Rust language",
          "forks_count": 0,
          "language": null,
          "name": "learning_rust",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2026-01-03T10:10:06Z"
        },
        {
          "description": "The Benfante's site",
          "forks_count": 0,
          "language": "XSLT",
          "name": "benfante-site",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-08-16T09:41:23Z"
        },
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": null,
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-11-18T13:47:32Z"
        },
        {
          "description": "An example of using Searchable for implementing search functionalities in Spring controllers.",
          "forks_count": 0,
          "language": "Java",
          "name": "searchable-example",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-12-01T13:28:20Z"
        },
        {
          "description": "A sample application for demonstrating the techniques and tools I currently use in developing an application.",
          "forks_count": 0,
          "language": null,
          "name": "my-modern-application-2023",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-06-18T15:53:37Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "XSLT",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 4,
        "event_breakdown": [
          {
            "count": 1,
            "type": "CreateEvent"
          },
          {
            "count": 3,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:22:57.892Z"
    },
    {
      "handle": "ederks85",
      "name": "Edwin Derks",
      "github_id": 4257239,
      "display_name": "Edwin Derks",
      "avatar_url": "https://avatars.githubusercontent.com/u/4257239?v=4",
      "bio": "Java Champion | Contributor for MicroProfile and Jakarta EE.",
      "company": null,
      "location": "Netherlands",
      "blog": "https://www.cloudnativesolutions.guru",
      "twitter_username": "edwinderks",
      "public_repos": 19,
      "public_gists": 0,
      "followers": 21,
      "following": 4,
      "hireable": null,
      "created_at": "2013-04-25T16:12:04Z",
      "updated_at": "2024-12-02T14:48:10Z",
      "top_repos": [
        {
          "description": "A Kotlin library to perform type-safe CRUD commands on a database through generated objects",
          "forks_count": 0,
          "language": null,
          "name": "db-objekts",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2022-12-29T10:20:57Z"
        },
        {
          "description": "Backup list for my friendly Java bubble",
          "forks_count": 0,
          "language": "Java",
          "name": "javabubble",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2022-11-22T08:17:07Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "jakartaee-schemas",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2021-11-23T14:53:14Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "managed-beans-spec",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2021-12-31T10:23:00Z"
        },
        {
          "description": "The Jakarta EE Platform project produces the Jakarta EE platform specification, which is an umbrella specification that aggregates all other Jakarta EE specifications.",
          "forks_count": 0,
          "language": null,
          "name": "jakartaee-platform",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2021-12-17T08:33:43Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Java"
      ],
      "recent_activity": {
        "recent_events": 0,
        "event_breakdown": []
      },
      "fetched_at": "2026-01-30T16:23:13.587Z"
    },
    {
      "handle": "lifey",
      "name": "Haim Yadid",
      "github_id": 1225052,
      "display_name": "Haim Yadid",
      "avatar_url": "https://avatars.githubusercontent.com/u/1225052?v=4",
      "bio": null,
      "company": "Next Insurance ",
      "location": null,
      "blog": "http://www.nextinsurance.com",
      "twitter_username": "lifeyx",
      "public_repos": 61,
      "public_gists": 3,
      "followers": 19,
      "following": 8,
      "hireable": null,
      "created_at": "2011-11-28T11:25:06Z",
      "updated_at": "2026-01-29T16:13:19Z",
      "top_repos": [
        {
          "description": "Java version of LangChain",
          "forks_count": 0,
          "language": null,
          "name": "langchain4j",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-07-17T06:12:00Z"
        },
        {
          "description": "Build your own serverless AI Chat with Retrieval-Augmented-Generation using LangChain.js, TypeScript and Azure",
          "forks_count": 0,
          "language": null,
          "name": "serverless-chat-langchainjs",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-05-04T04:30:13Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "voteroid",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-01-28T15:08:02Z"
        },
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": null,
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-12-04T07:05:44Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Kotlin",
          "name": "vectorAPI-playground",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-10-03T09:41:08Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Kotlin"
      ],
      "recent_activity": {
        "recent_events": 1,
        "event_breakdown": [
          {
            "count": 1,
            "type": "WatchEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:24:43.513Z"
    },
    {
      "handle": "JOpsDev",
      "name": "Tobias Frech",
      "github_id": 6024472,
      "display_name": "Tobias Frech",
      "avatar_url": "https://avatars.githubusercontent.com/u/6024472?v=4",
      "bio": null,
      "company": null,
      "location": null,
      "blog": "",
      "twitter_username": "TobiasFrech",
      "public_repos": 28,
      "public_gists": 0,
      "followers": 8,
      "following": 6,
      "hireable": null,
      "created_at": "2013-11-24T16:47:24Z",
      "updated_at": "2026-01-16T15:32:21Z",
      "top_repos": [
        {
          "description": null,
          "forks_count": 0,
          "language": "Python",
          "name": "ePA3-Service-OpenSource",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-11-20T17:26:25Z"
        },
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": null,
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2025-01-24T16:33:55Z"
        },
        {
          "description": "Experimental JUnit Jupiter Extension for writing integration tests for Maven plugins/Maven extensions/Maven Core",
          "forks_count": 0,
          "language": null,
          "name": "maven-it-extension",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-03-20T17:54:14Z"
        },
        {
          "description": "A Matrix <--> Slack bridge",
          "forks_count": 0,
          "language": null,
          "name": "matrix-appservice-slack",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2024-01-05T17:03:51Z"
        },
        {
          "description": "Backup list for my friendly Java bubble",
          "forks_count": 0,
          "language": "Java",
          "name": "javabubble",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-02-15T10:25:09Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "Python",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 5,
        "event_breakdown": [
          {
            "count": 5,
            "type": "PushEvent"
          }
        ]
      },
      "fetched_at": "2026-01-30T16:23:25.580Z"
    },
    {
      "handle": "edivargas",
      "name": "Jorge Vargas",
      "github_id": 10851227,
      "display_name": "edivargas",
      "avatar_url": "https://avatars.githubusercontent.com/u/10851227?v=4",
      "bio": "CTO at @mibomx\r\n. Software architect, dev and agilist by vocation. @JavaChampion since 2007. In Java since 1999. Proud graduate in @IPN_MX\r\n #JakartaEEAmbassado",
      "company": "@mibomx",
      "location": "Mexico",
      "blog": "http://jorgevargas.mx",
      "twitter_username": "edivargas",
      "public_repos": 5,
      "public_gists": 0,
      "followers": 6,
      "following": 1,
      "hireable": null,
      "created_at": "2015-02-04T15:47:07Z",
      "updated_at": "2024-12-21T14:30:56Z",
      "top_repos": [
        {
          "description": "A list of Java Champions",
          "forks_count": 0,
          "language": "CSS",
          "name": "java-champions",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2023-11-29T20:09:19Z"
        },
        {
          "description": "A demo repository for My JSON Server (Alpha)",
          "forks_count": 0,
          "language": null,
          "name": "demo",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2021-11-28T20:49:27Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": null,
          "name": "presentaciones",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2020-10-12T17:54:51Z"
        },
        {
          "description": null,
          "forks_count": 0,
          "language": "Java",
          "name": "jakartaEE-jsf",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2020-08-24T08:49:32Z"
        },
        {
          "description": "JakartaOne Live is a one day virtual conference for developers and technical business leaders that brings insights into the current state and future of Jakarta EE and related technologies focused on developing cloud-native Java applications. ",
          "forks_count": 0,
          "language": null,
          "name": "jakartaone.org",
          "open_issues_count": 0,
          "stargazers_count": 0,
          "topics": [],
          "updated_at": "2020-08-22T04:37:08Z"
        }
      ],
      "top_repos_stars": 0,
      "top_repos_forks": 0,
      "languages": [
        "CSS",
        "Java"
      ],
      "recent_activity": {
        "recent_events": 0,
        "event_breakdown": []
      },
      "fetched_at": "2026-01-30T16:24:34.683Z"
    }
  ]
};

    async function loadData() {
      try {
        const res = await fetch('../../scrapers/github/data.json');
        if (res.ok) return res.json();
      } catch (e) {}
      if (embeddedData) return embeddedData;
      throw new Error('No data');
    }

    loadData().then(render).catch(() => {
      document.getElementById('app').innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem;">
          <h2>⚠️ Could not load data</h2>
          <p style="color: var(--text-muted); margin-top: 1rem;">
            Run <code>npm run scrape:github</code> to fetch the data first.
          </p>
        </div>
      `;
    });
