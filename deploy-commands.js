/**
 * Deploy Commands script
 * Registers all slash commands with the Discord API
 */
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const logger = require('./handlers/logger');

// Create array for command data
const commands = [];

// Get command categories
const commandsPath = path.join(__dirname, 'commands');
const commandCategories = fs.readdirSync(commandsPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

// Load commands from each category
if (commandCategories.length > 0) {
    // New structure with categories
    for (const category of commandCategories) {
        const categoryPath = path.join(commandsPath, category);
        const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(categoryPath, file);
            const command = require(filePath);
            
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
                console.log(`Added command: ${command.data.name} from category ${category}`);
            } else {
                console.warn(`Command at ${filePath} is missing required "data" or "execute" property`);
            }
        }
    }
} else {
    // Legacy structure (no categories)
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`Added command: ${command.data.name}`);
        } else {
            console.warn(`Command at ${filePath} is missing required "data" or "execute" property`);
        }
    }
}

// Exit if no commands found
if (commands.length === 0) {
    console.error('No commands found to deploy!');
    process.exit(1);
}

// Setup REST API client
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy commands
(async () => {
    try {
        console.log(`Started deploying ${commands.length} application (/) commands.`);
        
        // The put method is used to fully refresh all commands
        const data = await rest.put(
            process.env.GUILD_ID
                ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
                : Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        
        console.log(`Successfully deployed ${data.length} application (/) commands ${process.env.GUILD_ID ? 'to test guild' : 'globally'}.`);
    } catch (error) {
        console.error(error);
    }
})();
