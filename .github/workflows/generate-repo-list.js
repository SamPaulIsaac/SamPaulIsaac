const fs = require('fs');
const path = require('path');
const { Octokit } = require("@octokit/rest");

// GitHub token with repo access
const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("Please set the GITHUB_TOKEN environment variable.");
  process.exit(1);
}

const octokit = new Octokit({ auth: token });
const username = "SamPaulIsaac";
const readmePath = path.join(__dirname, "..", "README.md");

async function getRepos() {
  let repos = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await octokit.repos.listForUser({
      username,
      per_page: perPage,
      page
    });

    repos = repos.concat(response.data);
    if (response.data.length < perPage) break;
    page++;
  }

  return repos;
}

function generateTable(repos) {
  let table = `| Repository | Description | Language | Stars | Forks | Visibility |\n`;
  table += `|-----------|------------|---------|-------|-------|-----------|\n`;

  repos.forEach(repo => {
    const nameCell = repo.private
      ? `${repo.name}` // non-clickable for private
      : `[${repo.name}](${repo.html_url})`;
    table += `| ${nameCell} | ${repo.description || "-"} | ${repo.language || "-"} | ${repo.stargazers_count} | ${repo.forks_count} | ${repo.private ? "Private" : "Public"} |\n`;
  });

  return table;
}

async function updateReadme() {
  const repos = await getRepos();
  const table = generateTable(repos);

  let readme = fs.readFileSync(readmePath, "utf8");
  const startTag = "<!-- START REPO TABLE -->";
  const endTag = "<!-- END REPO TABLE -->";

  const regex = new RegExp(`${startTag}[\\s\\S]*${endTag}`, "m");
  const newContent = `${startTag}\n${table}${endTag}`;
  readme = readme.replace(regex, newContent);

  fs.writeFileSync(readmePath, readme, "utf8");
  console.log("README.md updated successfully!");
}

updateReadme().catch(err => {
  console.error(err);
  process.exit(1);
});
