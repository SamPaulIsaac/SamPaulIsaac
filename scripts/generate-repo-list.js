import fs from "fs";
import fetch from "node-fetch";

const USERNAME = process.env.GITHUB_USERNAME;
const TOKEN = process.env.GITHUB_TOKEN;
const README_PATH = "./README.md";

console.log("Token present:", !!TOKEN);
    
async function fetchRepos() {
  const res = await fetch(
    `https://api.github.com/users/${process.env.GITHUB_USERNAME}/repos?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (!res.ok) {
    console.error("Status:", res.status);
    console.error(await res.text());
    throw new Error("Failed to fetch repos");
  }

  const data = await res.json();
  return data.sort((a, b) => b.stargazers_count - a.stargazers_count);
}


function generateRepoTable(repos) {
  let table = "| Name | Description | Stars |\n|------|-------------|-------|\n";
  repos.forEach(r => {
    const privateEmoji = r.private ? "🔒 " : "";
    const nameDisplay = `[${privateEmoji}${r.name}](${r.html_url})`;
    table += `| ${nameDisplay} | ${r.description || "-"} | ${r.stargazers_count} |\n`;
  });
  return table;
}

function updateReadme(table) {
  let readme = fs.readFileSync(README_PATH, "utf-8");
  const start = "<!-- START REPO TABLE -->";
  const end = "<!-- END REPO TABLE -->";
  const regex = new RegExp(`${start}[\\s\\S]*${end}`, "m");
  readme = readme.replace(regex, `${start}\n${table}${end}`);
  fs.writeFileSync(README_PATH, readme);
  console.log("README updated successfully with repo table!");
}

(async () => {
  try {
    const repos = await fetchRepos();
    const table = generateRepoTable(repos);
    updateReadme(table);
  } catch (err) {
    console.error("Error updating README:", err);
    process.exit(1);
  }
})();
