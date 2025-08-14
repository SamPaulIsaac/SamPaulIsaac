const fs = require('fs');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = 'SamPaulIsaac';
const readmePath = 'README.md';
const startMarker = '<!-- START REPO TABLE -->';
const endMarker = '<!-- END REPO TABLE -->';

async function getRepos() {
  let repos = [];
  let page = 1;

  while (true) {
    const { data } = await octokit.repos.listForUser({
      username: owner,
      type: 'all',
      per_page: 100,
      page,
    });

    if (!data.length) break;
    repos = repos.concat(data);
    page++;
  }

  return repos;
}

function formatRow(repo) {
  const visibility = repo.private ? 'Private' : 'Public';
  const nameText = repo.private ? repo.name : `[${repo.name}](${repo.html_url})`;
  const description = repo.description ? repo.description.replace(/\|/g, '\\|') : '-';
  const language = repo.language || '-';
  return `| ${nameText} | ${description} | ${language} | ${repo.stargazers_count} | ${repo.forks_count} | ${visibility} |`;
}

(async () => {
  try {
    const repos = await getRepos();
    repos.sort((a, b) => b.stargazers_count - a.stargazers_count);

    const tableHeader = '| Repository | Description | Language | Stars | Forks | Visibility |\n|-----------|------------|---------|-------|-------|-----------|';
    const tableRows = repos.map(formatRow).join('\n');
    const newTable = `${tableHeader}\n${tableRows}`;

    const readme = fs.readFileSync(readmePath, 'utf-8');
    const updatedReadme = readme.replace(
      new RegExp(`${startMarker}[\\s\\S]*${endMarker}`),
      `${startMarker}\n${newTable}\n${endMarker}`
    );

    fs.writeFileSync(readmePath, updatedReadme);
    console.log('README.md repo table updated successfully!');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
