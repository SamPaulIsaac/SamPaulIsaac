import fs from "fs";
import fetch from "node-fetch";

// CONFIG
const USERNAME = process.env.GITHUB_USERNAME; // GitHub Secrets
const TOKEN = process.env.GITHUB_TOKEN;       // GitHub Secrets
const README_PATH = "./README.md";
const STREAK_FILE = "./.github/workflows/streak.json"; // persists streak

// Fetch repositories
async function fetchRepos() {
  const response = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100`, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github.v3+json"
    }
  });
  const data = await response.json();
  return data.sort((a, b) => b.stargazers_count - a.stargazers_count);
}

// Generate markdown table
function generateTable(repos) {
  let table = "| Name | Description | Stars | URL |\n|------|-------------|-------|-----|\n";
  repos.forEach(r => {
    table += `| [${r.name}](${r.html_url}) | ${r.description || "-"} | ${r.stargazers_count} | [Link](${r.html_url}) |\n`;
  });
  return table;
}

// Read or initialize streak
function getStreak() {
  if (!fs.existsSync(STREAK_FILE)) {
    return { lastUpdated: new Date().toISOString().slice(0, 10), count: 0 };
  }
  return JSON.parse(fs.readFileSync(STREAK_FILE, "utf-8"));
}

// Update streak
function updateStreak(streak) {
  const today = new Date().toISOString().slice(0, 10);
  if (streak.lastUpdated === today) return streak; // already updated today
  streak.count += 1;
  streak.lastUpdated = today;
  fs.writeFileSync(STREAK_FILE, JSON.stringify(streak, null, 2));
  return streak;
}

// Update README
function updateReadme(table, streak) {
  let readme = fs.readFileSync(README_PATH, "utf-8");

  // Update repo table
  const start = "<!-- REPO_TABLE_START -->";
  const end = "<!-- REPO_TABLE_END -->";
  const regexTable = new RegExp(`${start}[\\s\\S]*${end}`, "m");
  readme = readme.replace(regexTable, `${start}\n${table}${end}`);

  // Update streak badge
  const streakBadgeRegex = /<img src="https:\/\/readme-streak-stats\.herokuapp\.com\/\?user=[^"]+"[^>]*>/;
  const newBadge = `<img src="https://readme-streak-stats.herokuapp.com/?user=${USERNAME}&theme=dark&count=${streak.count}" alt="GitHub Streak" />`;
  readme = readme.replace(streakBadgeRegex, newBadge);

  fs.writeFileSync(README_PATH, readme);
  console.log(`README updated! Current streak: ${streak.count}`);
}

// MAIN
(async () => {
  const repos = await fetchRepos();
  const table = generateTable(repos);
  let streak = getStreak();
  streak = updateStreak(streak);
  updateReadme(table, streak);
})();
