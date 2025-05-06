#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Function to execute a command and log its output
function runCommand(command) {
  console.log(`\nRunning: ${command}`);
  try {
    execSync(command, { stdio: "inherit" });
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Build the client
console.log("Building client...");
if (!runCommand("vite build")) {
  process.exit(1);
}

// Build the server
console.log("\nBuilding server...");
if (!runCommand("esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist")) {
  process.exit(1);
}

// Create server/public directory if it doesn't exist
const publicDir = path.resolve(__dirname, "server/public");
if (!fs.existsSync(publicDir)) {
  console.log(`\nCreating server/public directory...`);
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy the client files to server/public
console.log("\nCopying client files to server/public...");
const distDir = path.resolve(__dirname, "dist");
if (fs.existsSync(distDir)) {
  // Use cp -r to copy all files and directories
  runCommand(`cp -r ${distDir}/* ${publicDir}/`);
  console.log("Build completed successfully!");
} else {
  console.error("Error: dist directory does not exist after build");
  process.exit(1);
}