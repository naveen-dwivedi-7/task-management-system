#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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

console.log("Fixing deployment structure...");

// 1. Build the client with Vite
console.log("\nBuilding client...");
runCommand("vite build");

// 2. Create dist/public directory
const distPublicDir = path.join(__dirname, 'dist', 'public');
if (!fs.existsSync(distPublicDir)) {
  console.log(`\nCreating ${distPublicDir} directory...`);
  fs.mkdirSync(distPublicDir, { recursive: true });
}

// 3. Copy built client files to dist/public
console.log("\nCopying built client files to dist/public...");
const distDir = path.join(__dirname, 'dist');
const files = fs.readdirSync(distDir);

for (const file of files) {
  if (file !== 'public' && file !== 'index.js') {
    const sourcePath = path.join(distDir, file);
    const targetPath = path.join(distPublicDir, file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      console.log(`Copying directory: ${file}`);
      runCommand(`cp -r "${sourcePath}" "${distPublicDir}"`);
    } else {
      console.log(`Copying file: ${file}`);
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

// 4. Create index.html in dist/public if it doesn't exist
const indexHtmlPath = path.join(distPublicDir, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.log("\nCreating index.html in dist/public...");
  
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Management System</title>
  <link rel="stylesheet" href="/assets/index.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>`;
  
  fs.writeFileSync(indexHtmlPath, indexHtml);
}

// 5. Build the server
console.log("\nBuilding server...");
runCommand("esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist");

console.log("\nDeployment files prepared successfully!");
console.log("\nYou can now deploy the application with the correct directory structure.");