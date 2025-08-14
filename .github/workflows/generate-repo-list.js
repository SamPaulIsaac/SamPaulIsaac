const fs = require('fs');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN // Make sure your workflow sets GITHUB_TOKEN
});

const username = 'SamPaulIsaac';
const readmePath = 'README.md';

async function fetchRepos() {
  const repos = await octokit.paginate(octokit.repos.listForUser, {
    username,
    type: 'all',
    sort: 'updated',
    per_page: 100,
  });

  return repos.map(repo => ({
    name: repo.name,
    description: repo.description || '',
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    visibility: repo.private ? 'Private' : 'Public',
    url: repo.html_url,
  }));
}

function generateTable(repos) {
  const header = '| Repository | Description | Stars | Forks | Visibility |\n| --- | --- | --- | --- | --- |\n';
  const rows = repos.map(r =>
    `| [${r.name}](${r.url}) | ${r.description} | ${r.stars} | ${r.forks} | ${r.visibility} |`
  ).join('\n');

  return `${header}${rows}`;
}

async function updateReadme() {
  const repos = await fetchRepos();
  const table = generateTable(repos);

  const readme = fs.readFileSync(readmePath, 'utf8');
  const updatedReadme = readme.replace(
    /<!-- REPO-LIST-START -->[\s\S]*<!-- REPO-LIST-END -->/,
    `<!-- REPO-LIST-START -->\n${table}\n<!-- REPO-LIST-END -->`
  );

  fs.writeFileSync(readmePath, updatedReadme);
  console.log('README updated successfully!');
}

updateReadme().catch(err => {
  console.error('Error updating README:', err);
  process.exit(1);
});
