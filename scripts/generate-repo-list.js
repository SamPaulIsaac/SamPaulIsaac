import fs from "fs";
import fetch from "node-fetch";

const USERNAME = process.env.GITHUB_USERNAME;
const TOKEN = process.env.GITHUB_TOKEN;
const README_PATH = "./README.md";

// Fetch repositories
async function fetchRepos() {
  const response = await fetch(`https://api.github.com/user/repos?per_page=100`, {
    headers: { Authorization: `token ${TOKEN}`, Accept: "application/vnd.github.v3+json" }
  });

  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Failed to fetch repositories");

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

// Update README
function updateReadme(table) {
  let readme = fs.readFileSync(README_PATH, "utf-8");
  const start = "<!-- START REPO TABLE -->";
  const end = "<!-- END REPO TABLE -->";
  const regexTable = new RegExp(`${start}[\\s\\S]*${end}`, "m");
  readme = readme.replace(regexTable, `${start}\n${table}${end}`);
  fs.writeFileSync(README_PATH, readme);
  console.log("README updated successfully!");
}

(async () => {
  try {
    const repos = await fetchRepos();
    const table = generateTable(repos);
    updateReadme(table);
  } catch (err) {
    console.error("Script failed:", err);
    process.exit(1);
  }
})();
