const fs = require('fs');
const axios = require('axios');

const username = process.env.GITHUB_USER;
const token = process.env.GITHUB_TOKEN;
const readmePath = 'README.md';

async function fetchRepos() {
  const url = `https://api.github.com/user/repos?per_page=100&type=all`;
  const res = await axios.get(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json'
    }
  });
  return res.data;
}

async function fetchCommitCount(repoName) {
  const url = `https://api.github.com/repos/${username}/${repoName}/commits?per_page=1`;
  const res = await axios.get(url, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json'
    }
  });
  const totalCommits = res.headers['link'] 
    ? parseInt(res.headers['link'].match(/&page=(\d+)>; rel="last"/)[1]) 
    : res.data.length;
  return totalCommits;
}

async function generateMarkdown(repos) {
  let md = '| Repository | Stars | Forks | Visibility | Commits |\n';
  md += '|-----------|-------|-------|-----------|--------|\n';

  for (const repo of repos) {
    const commits = await fetchCommitCount(repo.name);
    md += `| [${repo.name}](${repo.html_url}) | ${repo.stargazers_count} | ${repo.forks_count} | ${repo.private ? 'Private' : 'Public'} | ${commits} |\n`;
  }

  return md;
}

async function updateReadme() {
  const repos = await fetchRepos();
  const repoMd = await generateMarkdown(repos);

  let readme = fs.readFileSync(readmePath, 'utf8');
  const startTag = '<!-- REPO-LIST-START -->';
  const endTag = '<!-- REPO-LIST-END -->';
  const regex = new RegExp(`${startTag}[\\s\\S]*${endTag}`, 'm');

  const replacement = `${startTag}\n${repoMd}\n${endTag}`;
  if (regex.test(readme)) {
    readme = readme.replace(regex, replacement);
  } else {
    readme += `\n${replacement}\n`;
  }

  fs.writeFileSync(readmePath, readme, 'utf8');
  console.log('README.md updated with repository list including commits.');
}

updateReadme().catch(err => {
  console.error('Error updating README:', err);
  process.exit(1);
});
