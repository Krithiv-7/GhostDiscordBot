/**
 * Event Handler for Ghost Discord Bot
 * Loads and manages all event handlers for Discord events
 */
const fs = require('node:fs');
const path = require('node:path');
const logger = require('./logger');

module.exports = {
    /**
     * Registers all events from the events directory
     * @param {Object} client - The Discord.js client instance
     */
    registerEvents(client) {
        const eventsPath = path.join(__dirname, '..', 'events');
        
        // Check if events directory exists, create if not
        if (!fs.existsSync(eventsPath)) {
            fs.mkdirSync(eventsPath, { recursive: true });
            
            // Create default events
            this.createDefaultEvents();
            logger.info('Created default event handlers');
        }
        
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
        let eventCount = 0;
        
        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            const event = require(filePath);
            
            // Validate event has required properties
            if (!event.name || !event.execute) {
                logger.warn(`Event at ${filePath} is missing required "name" or "execute" property`);
                continue;
            }
            
            // Register event handler
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
            
            eventCount++;
        }
        
        logger.info(`Registered ${eventCount} event handlers`);
    },
    
    /**
     * Creates default event handlers if none exist
     */
    createDefaultEvents() {
        const eventsPath = path.join(__dirname, '..', 'events');
        
        // Ready event
        fs.writeFileSync(
            path.join(eventsPath, 'ready.js'),
            `const { ActivityType } = require('discord.js');
const scheduler = require('../scheduler');
const logger = require('../handlers/logger');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        logger.info(\`Ready! Logged in as \${client.user.tag}\`);
        client.user.setActivity('Ghost Blogs', { type: ActivityType.Watching });
        scheduler.start(client);
    }
};`
        );
        
        // Interaction event
        fs.writeFileSync(
            path.join(eventsPath, 'interactionCreate.js'),
            `const commandHandler = require('../handlers/commandHandler');
const logger = require('../handlers/logger');

module.exports = {
    name: 'interactionCreate',
    once: false,
    execute(interaction) {
        // Handle autocomplete interactions
        if (interaction.isAutocomplete()) {
            return commandHandler.handleAutocomplete(interaction);
        }
        
        // Handle command interactions
        if (interaction.isCommand()) {
            return commandHandler.handleCommand(interaction);
        }
    }
};`
        );
    }
};
