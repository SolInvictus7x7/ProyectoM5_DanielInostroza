import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const GITHUB_TOKEN = process.env["GITHUB_TOKEN"];

if (!GITHUB_TOKEN) {
  throw new Error("Token no encontrado");
}

export const octokit: InstanceType<typeof Octokit> = new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: "GitHub API Client",
  baseUrl: "https://api.github.com",
});