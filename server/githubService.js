const axios = require("axios");

async function getGithubData(username) {
  try {
    const headers = {
      // Optional: Add GITHUB_TOKEN in .env if you hit rate limits
      // 'Authorization': `token ${process.env.GITHUB_TOKEN}`
    };

    // 1. Fetch Profile
    const userRes = await axios.get(
      `https://api.github.com/users/${username}`,
      { headers }
    );

    // 2. Fetch Repos
    const repoRes = await axios.get(
      `https://api.github.com/users/${username}/repos?sort=pushed&per_page=10`,
      { headers }
    );

    const profile = userRes.data;
    const repos = repoRes.data.map((repo) => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      url: repo.html_url,
    }));

    // Format data for the LLM
    const structuredData = {
      name: profile.name,
      bio: profile.bio,
      location: profile.location,
      public_repos: profile.public_repos,
      top_projects: repos,
    };

    return structuredData;
  } catch (error) {
    throw new Error(`GitHub fetch failed: ${error.message}`);
  }
}

module.exports = { getGithubData };
