/* eslint-disable @typescript-eslint/no-require-imports */
const { execFileSync } = require("node:child_process");

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

const isVercel = process.env.VERCEL === "1";
const isPostgres =
  typeof databaseUrl === "string" &&
  (databaseUrl.startsWith("postgres://") ||
    databaseUrl.startsWith("postgresql://"));

if (!isVercel) {
  console.log("Skipping Prisma migrate deploy outside Vercel.");
  process.exit(0);
}

if (!isPostgres) {
  console.log("Skipping Prisma migrate deploy because no Postgres URL was found.");
  process.exit(0);
}

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

execFileSync(npxCommand, ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
});
