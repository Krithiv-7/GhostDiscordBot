/**
 * Ghost Discord Bot - Main Entry Point
 * Version 1.0.1
 * 
 * A Discord bot that integrates with the Ghost Content API to automatically post new and updated blog articles.
 */
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const mainHandler = require('./handlers/mainHandler');
const logger = require('./handlers/logger');

// Create logs directory
const fs = require('node:fs');
if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs');
}

// Create a new client instance with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Process event handling for errors and warnings
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection', error);
});

process.on('uncaughtException', (error) => {
    logger.fatal('Uncaught exception', error);
    // Gracefully exit on uncaught exceptions after logging
    process.exit(1);
});

// Initialize bot and login
async function startBot() {
    logger.info('Starting Ghost Discord Bot v1.0.1');
    
    try {
        // Initialize the bot
        const initialized = await mainHandler.init(client);
        if (!initialized) {
            logger.fatal('Failed to initialize bot, shutting down');
            process.exit(1);
        }
        
        // Login to Discord
        logger.info('Logging in to Discord...');
        await client.login(process.env.DISCORD_TOKEN);
    } catch (error) {
        logger.fatal('Failed to start bot', error);
        process.exit(1);
    }
}

startBot();