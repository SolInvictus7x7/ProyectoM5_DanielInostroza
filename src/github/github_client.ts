import { Octokit } from "@octokit/rest";
import { retry } from "@octokit/plugin-retry";
import dotenv from "dotenv";
import { logger } from "../utils/logger.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

const GITHUB_TOKEN = process.env["GITHUB_TOKEN"];

if (!GITHUB_TOKEN) {
  logger.error("GITHUB_TOKEN is missing from the environment variables.");
  throw new Error("Token no encontrado");
}

// Create an Octokit instance that includes the retry plugin directly
export const octokit: Octokit = new (Octokit.plugin(retry))({
  auth: GITHUB_TOKEN,
  userAgent: "GitHub API Client",
  baseUrl: "https://api.github.com",
  request: {
    retries: 3,
    retryAfter: 1, // Fallback base retry time if not provided by GitHub headers
  },
  log: {
    debug: (message: string) => logger.debug(message),
    info: (message: string) => logger.info(message),
    warn: (message: string) => logger.warn(message),
    error: (message: string) => logger.error(message),
  }
});