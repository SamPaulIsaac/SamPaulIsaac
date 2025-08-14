const { Octokit } = require("@octokit/rest");
const fs = require("fs");
require("dotenv").config();

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const username = "SamPaulIsaac";
const readmePath = "./README.md";

(async () => {
  try {
    const repos = await octokit.rest.repos.listForUser({
      username,
      type: "all",
      sort: "updated",
      per_page: 100,
    });

    let table = `| Repository | Description | Language | Stars | Forks | Visibility |\n`;
    table += `|-----------|------------|---------|-------|-------|-----------|\n`;

    repos.data.forEach(repo => {
      const repoName = repo.private
        ? `${repo.name}` // Non-clickable for private
        : `[${repo.name}](${repo.html_url})`; // Clickable for public

      table += `| ${repoName} | ${repo.description || "-"} | ${repo.language || "-"} | ${repo.stargazers_count} | ${repo.forks_count} | ${repo.private ? "Private" : "Public"} |\n`;
    });

    const readme = fs.readFileSync(readmePath, "utf-8");
    const newReadme = readme.replace(
      /<!-- REPO-LIST-START -->[\s\S]*<!-- REPO-LIST-END -->/,
      `<!-- REPO-LIST-START -->\n${table}<!-- REPO-LIST-END -->`
    );

    fs.writeFileSync(readmePath, newReadme);
    console.log("README table updated successfully.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
