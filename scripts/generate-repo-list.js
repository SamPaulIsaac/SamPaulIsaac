import fs from "fs";
import fetch from "node-fetch";

// CONFIG
const USERNAME = process.env.GITHUB_USERNAME;
const TOKEN = process.env.GITHUB_TOKEN;
const README_PATH = "./README.md";
const STREAK_FILE = "./.github/workflows/streak.json";

// Fetch repositories
async function fetchRepos() {
  const response = await fetch(`https://api.github.com/user/repos?per_page=100`, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github.v3+json"
    }
  });

  const data = await response.json();
  console.log("API response:", data);

  if (!Array.isArray(data)) {
    console.error("Error fetching repos from GitHub API:", data);
    throw new Error("Failed to fetch repositories. Check USERNAME and TOKEN secrets.");
  }

  return data.sort((a, b) => b.stargazers_count - a.stargazers_count);
}

// Generate Markdown table (all clickable)
function generateTable(repos) {
  let table = "| Name | Description | Stars |\n|------|-------------|-------|\n";
  repos.forEach(r => {
    // Add lock emoji if private
    const privateEmoji = r.private ? "🔒 " : "";
    const nameDisplay = `[${privateEmoji}${r.name}](${r.html_url})`;
    table += `| ${nameDisplay} | ${r.description || "-"} | ${r.stargazers_count} |\n`;
  });
  return table;
}

// Read or initialize streak
function getStreak() {
  if (!fs.existsSync(STREAK_FILE)) {
    return { lastUpdated: new Date().toISOString().slice(0, 10), count: 0 };
  }
  try {
    return JSON.parse(fs.readFileSync(STREAK_FILE, "utf-8"));
  } catch (err) {
    console.error("Error reading streak file:", err);
    return { lastUpdated: new Date().toISOString().slice(0, 10), count: 0 };
  }
}

// Update streak
function updateStreak(streak) {
  const today = new Date().toISOString().slice(0, 10);
  if (streak.lastUpdated === today) return streak;
  streak.count += 1;
  streak.lastUpdated = today;
  try {
    fs.writeFileSync(STREAK_FILE, JSON.stringify(streak, null, 2));
  } catch (err) {
    console.error("Error writing streak file:", err);
  }
  return streak;
}

// Update README
function updateReadme(table, streak) {
  let readme;
  try {
    readme = fs.readFileSync(README_PATH, "utf-8");
  } catch (err) {
    console.error("Error reading README.md:", err);
    throw err;
  }

  const start = "<!-- START REPO TABLE -->";
  const end = "<!-- END REPO TABLE -->";
  const regexTable = new RegExp(`${start}[\\s\\S]*${end}`, "m");
  readme = readme.replace(regexTable, `${start}\n${table}${end}`);

  const streakBadgeRegex = /<img src="https:\/\/readme-streak-stats\.herokuapp\.com\/\?user=[^"]+"[^>]*>/;
  const newBadge = `<img src="https://readme-streak-stats.herokuapp.com/?user=${USERNAME}&theme=dark&count=${streak.count}" alt="GitHub Streak" />`;
  readme = readme.replace(streakBadgeRegex, newBadge);

  try {
    fs.writeFileSync(README_PATH, readme);
  } catch (err) {
    console.error("Error writing README.md:", err);
    throw err;
  }

  console.log(`README updated successfully! Current streak: ${streak.count}`);
}

// MAIN
(async () => {
  try {
    const repos = await fetchRepos();
    const table = generateTable(repos);
    let streak = getStreak();
    streak = updateStreak(streak);
    updateReadme(table, streak);
  } catch (err) {
    console.error("Script failed:", err);
    process.exit(1);
  }
})();
