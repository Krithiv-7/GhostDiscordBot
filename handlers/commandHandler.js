/**
 * Command Handler for Ghost Discord Bot
 * Loads and manages all slash commands from the commands directory
 */
const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');
const logger = require('./logger');

module.exports = {
    /**
     * Registers all commands from the commands directory
     * @param {Object} client - The Discord.js client instance
     */
    registerCommands(client) {
        // Initialize commands collection if it doesn't exist
        client.commands = new Collection();
        
        // Path to commands directory
        const commandsPath = path.join(__dirname, '..', 'commands');
        
        // Get all command categories (subdirectories)
        const commandCategories = fs.readdirSync(commandsPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
            
        // If there are no subdirectories, use the old structure
        if (commandCategories.length === 0) {
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                this.loadCommand(client, filePath);
            }
            
            logger.info(`Loaded ${client.commands.size} commands (legacy structure)`);
            return;
        }
        
        // Load commands from each category
        let commandCount = 0;
        
        for (const category of commandCategories) {
            const categoryPath = path.join(commandsPath, category);
            const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const filePath = path.join(categoryPath, file);
                if (this.loadCommand(client, filePath)) {
                    commandCount++;
                }
            }
        }
        
        logger.info(`Loaded ${commandCount} commands from ${commandCategories.length} categories`);
    },
    
    /**
     * Loads a single command from a file
     * @param {Object} client - The Discord.js client instance
     * @param {string} filePath - Path to the command file
     * @returns {boolean} - Whether the command was loaded successfully
     */
    loadCommand(client, filePath) {
        try {
            const command = require(filePath);
            
            // Validate command has required properties
            if (!command.data || !command.execute) {
                logger.warn(`Command at ${filePath} is missing required "data" or "execute" property`);
                return false;
            }
            
            // Add command to collection
            client.commands.set(command.data.name, command);
            return true;
        } catch (error) {
            logger.error(`Error loading command at ${filePath}`, error);
            return false;
        }
    },
    
    /**
     * Handles command interactions
     * @param {Object} interaction - The Discord.js interaction
     * @returns {Promise<void>}
     */
    async handleCommand(interaction) {
        if (!interaction.isCommand()) return;
        
        const command = interaction.client.commands.get(interaction.commandName);
        
        if (!command) {
            logger.warn(`Command not found: ${interaction.commandName}`);
            return;
        }
        
        try {
            await command.execute(interaction);
        } catch (error) {
            logger.error(`Error executing command ${interaction.commandName}`, error);
            
            // Send error message if interaction is still valid
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ 
                    content: 'There was an error while executing this command!', 
                    ephemeral: true 
                }).catch(() => {});
            } else {
                await interaction.reply({ 
                    content: 'There was an error while executing this command!', 
                    ephemeral: true 
                }).catch(() => {});
            }
        }
    },
    
    /**
     * Handles autocomplete interactions
     * @param {Object} interaction - The Discord.js interaction
     * @returns {Promise<void>}
     */
    async handleAutocomplete(interaction) {
        if (!interaction.isAutocomplete()) return;
        
        const command = interaction.client.commands.get(interaction.commandName);
        
        if (!command || !command.autocomplete) {
            logger.warn(`No autocomplete handler for command: ${interaction.commandName}`);
            return;
        }
        
        try {
            await command.autocomplete(interaction);
        } catch (error) {
            logger.error(`Error in autocomplete for command ${interaction.commandName}`, error);
        }
    }
};
