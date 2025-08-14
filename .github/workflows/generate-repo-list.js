const fs = require('fs');
const path = require('path');
const { Octokit } = require("@octokit/rest");

// GitHub token must be set in Actions secrets
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("Error: GITHUB_TOKEN is not set in workflow secrets.");
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

const username = 'SamPaulIsaac';
const readmePath = path.join(process.cwd(), 'README.md');

async function fetchRepos() {
  let repos = [];
  let page = 1;

  while (true) {
    const { data } = await octokit.repos.listForUser({
      username,
      per_page: 100,
      page,
    });

    if (data.length === 0) break;
    repos = repos.concat(data);
    page++;
  }

  return repos;
}

function generateTable(repos) {
  const header = `| Repository | Description | Language | Stars | Forks | Visibility |\n|-----------|------------|---------|-------|-------|-----------|`;
  const rows = repos.map(repo => {
    const name = repo.private ? repo.name : `[${repo.name}](${repo.html_url})`;
    return `| ${name} | ${repo.description || '-'} | ${repo.language || '-'} | ${repo.stargazers_count} | ${repo.forks_count} | ${repo.private ? 'Private' : 'Public'} |`;
  });

  return [header, ...rows].join('\n');
}

async function updateReadme(tableContent) {
  const readme = fs.readFileSync(readmePath, 'utf-8');

  const updated = readme.replace(
    /<!-- START REPO TABLE -->[\s\S]*<!-- END REPO TABLE -->/,
    `<!-- START REPO TABLE -->\n${tableContent}\n<!-- END REPO TABLE -->`
  );

  fs.writeFileSync(readmePath, updated, 'utf-8');
  console.log("✅ README.md updated successfully.");
}

(async () => {
  try {
    const repos = await fetchRepos();
    const tableContent = generateTable(repos);
    await updateReadme(tableContent);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
