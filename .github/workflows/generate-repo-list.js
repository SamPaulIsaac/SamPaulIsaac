const fs = require('fs');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const username = 'SamPaulIsaac';
const readmePath = 'README.md';

async function fetchRepos() {
  const repos = await octokit.paginate(octokit.repos.listForUser, {
    username,
    type: 'all',
    per_page: 100
  });
  return repos;
}

function generateTable(repos) {
  let table = `| Repository | Description | Language | Stars | Forks |\n`;
  table += `|-----------|------------|---------|-------|-------|\n`;

  repos
    .sort((a, b) => b.stargazers_count - a.stargazers_count) // sort by stars
    .forEach(repo => {
      const name = `[${repo.name}](${repo.html_url})`;
      const desc = repo.description ? repo.description.replace(/\|/g, '\\|') : '-';
      const lang = repo.language || '-';
      const stars = repo.stargazers_count;
      const forks = repo.forks_count;
      table += `| ${name} | ${desc} | ${lang} | ${stars} | ${forks} |\n`;
    });

  return table;
}

async function updateReadme() {
  const repos = await fetchRepos();
  const repoTable = generateTable(repos);

  let readme = fs.readFileSync(readmePath, 'utf-8');

  const startTag = '<!-- START REPO TABLE -->';
  const endTag = '<!-- END REPO TABLE -->';

  const regex = new RegExp(`${startTag}[\\s\\S]*?${endTag}`, 'm');

  const newContent = `${startTag}\n${repoTable}${endTag}`;

  if (regex.test(readme)) {
    readme = readme.replace(regex, newContent);
  } else {
    // if tags not found, append at the end
    readme += `\n${newContent}\n`;
  }

  fs.writeFileSync(readmePath, readme, 'utf-8');
  console.log('README.md updated successfully!');
}

updateReadme().catch(err => {
  console.error(err);
  process.exit(1);
});
