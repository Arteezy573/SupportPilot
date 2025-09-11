#!/usr/bin/env node

/**
 * Development setup script for Support Pilot
 * This script handles the proper startup sequence for hot reloading
 * 
 * Note: This file is excluded from ESLint via eslint.config.js ignores pattern
 * since it's a Node.js script with different environment requirements than the main codebase
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const isDev = process.env.NODE_ENV === "development" || process.argv.includes("--dev");
const isHot = process.argv.includes("--hot");

console.log("🚀 Starting Support Pilot development environment...");
console.log(`Mode: ${isDev ? "Development" : "Production"}`);
console.log(`Hot Reload: ${isHot ? "Enabled" : "Disabled"}`);

// Ensure dist directory exists
const distPath = path.join(__dirname, "..", "dist");
if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
    console.log("📁 Created dist directory");
}

// Function to spawn a process with proper logging
function spawnProcess(command, args, options = {}) {
    const child = spawn(command, args, {
        stdio: "inherit",
        shell: true,
        ...options,
    });

    child.on("error", (err) => {
        console.error(`❌ Error starting ${command}:`, err);
    });

    child.on("close", (code) => {
        if (code !== 0) {
            console.error(`❌ ${command} exited with code ${code}`);
        }
    });

    return child;
}

// Start the development processes
async function startDevelopment() {
    try {
        if (isHot) {
            console.log("🔥 Starting hot reload development...");
            
            // Start main process build in watch mode
            console.log("📦 Building main process (watch mode)...");
            spawnProcess("npm", ["run", "dev:main"]);
            
            // Start preload script build in watch mode
            console.log("📦 Building preload script (watch mode)...");
            spawnProcess("npm", ["run", "dev:preload"]);
            
            // Wait a moment for builds to start
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Start webpack dev server with hot reload
            console.log("🌐 Starting webpack dev server with hot reload...");
            spawnProcess("npm", ["run", "dev:server"]);
            
            // Wait for dev server to be ready, then start Electron
            console.log("⏳ Waiting for dev server to be ready...");
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            console.log("⚡ Starting Electron with hot reload...");
            spawnProcess("npm", ["run", "electron:dev"]);
            
        } else {
            console.log("📦 Starting standard development mode...");
            spawnProcess("npm", ["run", "start:watch"]);
        }
        
    } catch (error) {
        console.error("❌ Failed to start development environment:", error);
        process.exit(1);
    }
}

// Handle process cleanup
process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down development environment...");
    process.exit(0);
});

process.on("SIGTERM", () => {
    console.log("\n🛑 Shutting down development environment...");
    process.exit(0);
});

// Start the development environment
startDevelopment();
