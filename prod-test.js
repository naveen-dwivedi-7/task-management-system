#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check if server/public exists
const publicDir = path.join(__dirname, 'server', 'public');
console.log(`Checking if ${publicDir} exists...`);

if (!fs.existsSync(publicDir)) {
  console.log(`Creating ${publicDir}...`);
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create a sample index.html file
const indexPath = path.join(publicDir, 'index.html');
console.log(`Creating sample index.html at ${indexPath}...`);

const sampleHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Management System</title>
</head>
<body>
  <h1>Task Management System</h1>
  <p>This is a test file for production deployment.</p>
</body>
</html>
`;

fs.writeFileSync(indexPath, sampleHtml);

// Build the server 
console.log('\nBuilding server...');
exec('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error building server: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
  
  if (stdout) {
    console.log(`stdout: ${stdout}`);
  }
  
  // Try running the server in production mode
  console.log('\nStarting server in production mode...');
  const serverProcess = exec('NODE_ENV=production node dist/index.js');
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`server: ${data}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`server error: ${data}`);
  });
  
  // Kill the server after 10 seconds
  setTimeout(() => {
    console.log('\nShutting down test server...');
    serverProcess.kill();
    console.log('Test completed');
  }, 10000);
});