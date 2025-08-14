const { writeFileSync, readFileSync } = require("fs");
const { Octokit } = require("octokit");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("Error: GITHUB_TOKEN not set in Actions secrets!");
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const username = "SamPaulIsaac";
const readmePath = "README.md";

async function fetchRepos(page = 1, repos = []) {
  try {
    const response = await octokit.rest.repos.listForUser({
      username,
      per_page: 100,
      page,
      type: "all", // include private repos
    });

    repos.push(...response.data);

    if (response.data.length === 100) {
      return fetchRepos(page + 1, repos);
    }

    return repos;
  } catch (err) {
    console.error("Error fetching repos:", err.message);
    process.exit(1);
  }
}

function buildTable(repos) {
  let table = `<!-- START REPO TABLE -->\n| Repository | Description | Language | Stars | Forks | Visibility |\n|-----------|------------|---------|-------|-------|-----------|\n`;

  repos.forEach((repo) => {
    // Private repos are plain text; public repos are clickable
    const nameDisplay = repo.private ? repo.name : `[${repo.name}](${repo.html_url})`;
    table += `| ${nameDisplay} | ${repo.description || "-"} | ${repo.language || "-"} | ${repo.stargazers_count} | ${repo.forks_count} | ${repo.private ? "Private" : "Public"} |\n`;
  });

  table += "<!-- END REPO TABLE -->";
  return table;
}

async function updateReadme() {
  const repos = await fetchRepos();
  const readme = readFileSync(readmePath, "utf-8");
  const newTable = buildTable(repos);

  const updated = readme.replace(/<!-- START REPO TABLE -->[\s\S]*<!-- END REPO TABLE -->/, newTable);
  writeFileSync(readmePath, updated, "utf-8");

  console.log("✅ README.md repo table updated successfully!");
}

updateReadme();
