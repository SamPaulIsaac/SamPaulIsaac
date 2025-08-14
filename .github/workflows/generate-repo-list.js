const { writeFileSync, readFileSync } = require("fs");
const { Octokit } = require("@octokit/rest");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("Error: GITHUB_TOKEN not set in Actions secrets!");
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const username = "SamPaulIsaac";
const readmePath = "README.md";

// Fetch all repos including private
async function fetchRepos(page = 1, repos = []) {
  try {
    const response = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 100,
      page,
      sort: "updated",
      affiliation: "owner",
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

// Build Markdown table
function buildTable(repos) {
  let table = `<!-- START REPO TABLE -->\n| Repository | Description | Language | Stars | Forks | Visibility |\n|-----------|------------|---------|-------|-------|-----------|\n`;

  repos.forEach((repo) => {
    // Only link public repos
    const nameDisplay = repo.private ? repo.name : `[${repo.name}](${repo.html_url})`;
    table += `| ${nameDisplay} | ${repo.description || "-"} | ${repo.language || "-"} | ${repo.stargazers_count} | ${repo.forks_count} | ${repo.private ? "Private" : "Public"} |\n`;
  });

  table += "<!-- END REPO TABLE -->";
  return table;
}

// Update README.md
async function updateReadme() {
  const repos = await fetchRepos();
  let readme = readFileSync(readmePath, "utf-8");

  // If repo table does not exist yet, insert a placeholder
  if (!readme.includes("<!-- START REPO TABLE -->")) {
    readme += "\n\n<!-- START REPO TABLE -->\n<!-- END REPO TABLE -->";
  }

  const newTable = buildTable(repos);
  const updated = readme.replace(/<!-- START REPO TABLE -->[\s\S]*<!-- END REPO TABLE -->/, newTable);

  writeFileSync(readmePath, updated, "utf-8");
  console.log("✅ README.md repo table updated successfully!");
}

updateReadme();
