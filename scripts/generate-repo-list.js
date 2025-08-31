import fs from "fs";
import fetch from "node-fetch";

// CONFIG
const USERNAME = process.env.GITHUB_USERNAME;
const TOKEN = process.env.GITHUB_TOKEN;
const README_PATH = "./README.md";
const STREAK_FILE = "./.github/workflows/streak.json";

// Fetch repositories
async function fetchRepos() {
  console.log("Fetching repositories from GitHub...");
  const response = await fetch(`https://api.github.com/user/repos?per_page=100`, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github.v3+json"
    }
  });

  const data = await response.json();
  if (!Array.isArray(data)) {
    console.error("Error fetching repos:", data);
    throw new Error("Failed to fetch repositories. Check USERNAME and TOKEN.");
  }

  console.log(`Fetched ${data.length} repositories.`);
  return data.sort((a, b) => b.stargazers_count - a.stargazers_count);
}

// Generate Markdown table
function generateTable(repos) {
  let table = "| Name | Description | Stars |\n|------|-------------|-------|\n";
  repos.forEach(r => {
    const privateEmoji = r.private ? "🔒 " : "";
    const nameDisplay = `[${privateEmoji}${r.name}](${r.html_url})`;
    table += `| ${nameDisplay} | ${r.description || "-"} | ${r.stargazers_count} |\n`;
  });
  return table;
}

// Read or initialize streak
function getStreak() {
  const today = new Date().toISOString().slice(0, 10);

  if (!fs.existsSync(STREAK_FILE)) {
    console.log("Streak file not found, initializing...");
    const initialStreak = { lastUpdated: today, count: 1 };
    fs.writeFileSync(STREAK_FILE, JSON.stringify(initialStreak, null, 2));
    return initialStreak;
  }

  try {
    return JSON.parse(fs.readFileSync(STREAK_FILE, "utf-8"));
  } catch (err) {
    console.error("Error reading streak file, reinitializing:", err);
    const fallbackStreak = { lastUpdated: today, count: 1 };
    fs.writeFileSync(STREAK_FILE, JSON.stringify(fallbackStreak, null, 2));
    return fallbackStreak;
  }
}

// Update streak
function updateStreak(streak) {
  const today = new Date().toISOString().slice(0, 10);
  if (streak.lastUpdated === today) {
    console.log("Streak already updated today.");
    return streak;
  }

  streak.count += 1;
  streak.lastUpdated = today;

  try {
    fs.writeFileSync(STREAK_FILE, JSON.stringify(streak, null, 2));
    console.log(`Streak updated! Current streak: ${streak.count}`);
  } catch (err) {
    console.error("Error writing streak file:", err);
  }

  return streak;
}

// Update README
function updateReadme(table, streak) {
  console.log("Updating README.md...");
  let readme;
  try {
    readme = fs.readFileSync(README_PATH, "utf-8");
  } catch (err) {
    console.error("Error reading README.md:", err);
    throw err;
  }

  // Update repo table
  const start = "<!-- START REPO TABLE -->";
  const end = "<!-- END REPO TABLE -->";
  const regexTable = new RegExp(`${start}[\\s\\S]*${end}`, "m");
  readme = readme.replace(regexTable, `${start}\n${table}${end}`);

  // Update streak badge
  const streakBadgeRegex = /<img src="https:\/\/streak-stats\.demolab\.com\/\?user=[^"]+"[^>]*>/;
  const newBadge = `<img src="https://streak-stats.demolab.com/?user=${USERNAME}&theme=dark&count=${streak.count}" alt="GitHub Streak" />`;
  if (readme.match(streakBadgeRegex)) {
    readme = readme.replace(streakBadgeRegex, newBadge);
  } else {
    // If badge not found, append at the end
    readme += `\n<p align="center">\n  ${newBadge}\n</p>\n`;
  }

  try {
    fs.writeFileSync(README_PATH, readme);
    console.log("README.md updated successfully!");
  } catch (err) {
    console.error("Error writing README.md:", err);
    throw err;
  }
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
