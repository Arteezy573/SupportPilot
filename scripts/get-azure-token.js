#!/usr/bin/env node

/**
 * Azure Token Retrieval Script for Support Pilot Development
 * 
 * This script retrieves a bearer token using DefaultAzureCredential before starting Electron.
 * The token is passed as an environment variable to the Electron process to avoid
 * authentication issues in the Electron environment.
 * 
 * Usage: node scripts/get-azure-token.js [command] [args...]
 * Example: node scripts/get-azure-token.js electron .
 */

const { DefaultAzureCredential, getBearerTokenProvider } = require("@azure/identity");
const { spawn } = require("child_process");

// Default scope for Azure Cognitive Services
const DEFAULT_SCOPE = "https://cognitiveservices.azure.com/.default";

/**
 * Configuration for Azure authentication
 * Can be overridden via environment variables
 */
const config = {
    tenantId: process.env.AZURE_TENANT_ID,
    clientId: process.env.AZURE_CLIENT_ID,
    scope: process.env.AZURE_SCOPE || DEFAULT_SCOPE,
    timeout: parseInt(process.env.AZURE_TOKEN_TIMEOUT || "30000", 10), // 30 seconds default
};

/**
 * Retrieve bearer token using DefaultAzureCredential
 */
async function getBearerToken() {
    console.log("🔐 Retrieving Azure bearer token...");
    
    try {
        // Initialize DefaultAzureCredential with optional configuration
        const credentialOptions = {};
        if (config.tenantId) {
            credentialOptions.tenantId = config.tenantId;
            console.log(`   Using tenant ID: ${config.tenantId.substring(0, 8)}...`);
        }
        if (config.clientId) {
            credentialOptions.managedIdentityClientId = config.clientId;
            console.log(`   Using client ID: ${config.clientId.substring(0, 8)}...`);
        }

        const credential = new DefaultAzureCredential(credentialOptions);
        
        // Create bearer token provider
        const tokenProvider = getBearerTokenProvider(credential, config.scope);
        
        // Get the actual token (this will invoke the provider)
        console.log(`   Requesting token for scope: ${config.scope}`);
        
        // Use Promise.race to implement timeout
        const tokenPromise = tokenProvider();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Token acquisition timed out after ${config.timeout}ms`)), config.timeout);
        });
        
        const token = await Promise.race([tokenPromise, timeoutPromise]);
        
        if (!token) {
            throw new Error("Token provider returned empty token");
        }
        
        console.log("✅ Bearer token retrieved successfully");
        console.log(`   Token prefix: ${token.substring(0, 20)}...`);
        
        return token;
        
    } catch (error) {
        console.error("❌ Failed to retrieve bearer token:", error.message);
        
        // Provide helpful debugging information
        console.log("\n🔍 Troubleshooting suggestions:");
        console.log("   1. Ensure you are logged in via Azure CLI: az login");
        console.log("   2. Check your Azure subscription: az account show");
        console.log("   3. Verify your access to the Azure AI Foundry resource");
        console.log("   4. Try setting environment variables:");
        console.log("      - AZURE_TENANT_ID");
        console.log("      - AZURE_CLIENT_ID (for managed identity)");
        console.log("      - AZURE_SCOPE (if different from default)");
        
        throw error;
    }
}

/**
 * Execute the target command with the bearer token as an environment variable
 */
async function executeWithToken(command, args) {
    console.log(`🚀 Executing: ${command} ${args.join(" ")}`);
    
    const child = spawn(command, args, {
        stdio: "inherit",
        shell: true,
        env: {
            ...process.env,
            AZURE_BEARER_TOKEN: await getBearerToken(),
            NODE_ENV: process.env.NODE_ENV || "development",
        },
    });

    child.on("error", (err) => {
        console.error(`❌ Error executing ${command}:`, err.message);
        process.exit(1);
    });

    child.on("close", (code) => {
        if (code !== 0) {
            console.error(`❌ ${command} exited with code ${code}`);
            process.exit(code);
        } else {
            console.log(`✅ ${command} completed successfully`);
        }
    });

    // Handle process cleanup
    process.on("SIGINT", () => {
        console.log("\n🛑 Terminating child process...");
        child.kill("SIGINT");
    });

    process.on("SIGTERM", () => {
        console.log("\n🛑 Terminating child process...");
        child.kill("SIGTERM");
    });
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error("❌ No command specified");
        console.log("Usage: node scripts/get-azure-token.js [command] [args...]");
        console.log("Example: node scripts/get-azure-token.js electron .");
        process.exit(1);
    }
    
    const command = args[0];
    const commandArgs = args.slice(1);
    
    console.log("🔧 Support Pilot - Azure Token Retrieval");
    console.log("=" .repeat(50));
    
    try {
        await executeWithToken(command, commandArgs);
    } catch (error) {
        console.error("❌ Failed to execute command with token:", error.message);
        process.exit(1);
    }
}

// Run if this script is executed directly
if (require.main === module) {
    main().catch((error) => {
        console.error("❌ Unexpected error:", error);
        process.exit(1);
    });
}

module.exports = {
    getBearerToken,
    executeWithToken,
};