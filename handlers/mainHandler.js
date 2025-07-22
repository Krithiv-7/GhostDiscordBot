/**
 * Main handler for Ghost Discord Bot
 * Centralizes bot initialization and management
 */
const db = require('../database');
const logger = require('./logger');
const commandHandler = require('./commandHandler');
const eventHandler = require('./eventHandler');

module.exports = {
    /**
     * Initializes the bot
     * @param {Object} client - The Discord.js client instance
     */
    async init(client) {
        try {
            // Initialize database
            logger.info('Initializing database...');
            db.init();
            
            // Register commands
            logger.info('Registering commands...');
            commandHandler.registerCommands(client);
            
            // Register events
            logger.info('Registering events...');
            eventHandler.registerEvents(client);
            
            // Log successful initialization
            logger.info('Bot initialized successfully');
            
            return true;
        } catch (error) {
            logger.fatal('Failed to initialize bot', error);
            return false;
        }
    }
};
