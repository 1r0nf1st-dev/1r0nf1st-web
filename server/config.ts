export const config = {
  port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3001,
  githubToken: process.env.GITHUB_TOKEN,
  githubUsername: process.env.GITHUB_USERNAME,
  publicApiBase: process.env.PUBLIC_API_BASE,
};
