import fs from "fs";
import fetch from "node-fetch";

// CONFIG
const USERNAME = process.env.GITHUB_USERNAME; // set in GitHub Secrets
const TOKEN = process.env.GITHUB_TOKEN;       // set in GitHub Secrets
const README_PATH = "./README.md";

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

// Update README
function updateReadme(table) {
  let readme = fs.readFileSync(README_PATH, "utf-8");
  const start = "<!-- REPO_TABLE_START -->";
  const end = "<!-- REPO_TABLE_END -->";
  const regex = new RegExp(`${start}[\\s\\S]*${end}`, "m");
  readme = readme.replace(regex, `${start}\n${table}${end}`);
  fs.writeFileSync(README_PATH, readme);
  console.log("README updated successfully!");
}

// MAIN
(async () => {
  const repos = await fetchRepos();
  const table = generateTable(repos);
  updateReadme(table);
})();
