require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// Force the client ID
const CLIENT_ID = '1397122901471268935';

console.log('Using explicit CLIENT_ID:', CLIENT_ID);
console.log('Env CLIENT_ID:', process.env.CLIENT_ID);

// Create array for command data
const commands = [];

// Get command categories
const commandsPath = path.join(__dirname, 'commands');
const commandCategories = fs.readdirSync(commandsPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

// Load commands from each category
for (const category of commandCategories) {
    const categoryPath = path.join(commandsPath, category);
    const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(categoryPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`Added command: ${command.data.name} from category ${category}`);
        }
    }
}

// Setup REST API client
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy commands
(async () => {
    try {
        console.log(`Started deploying ${commands.length} application (/) commands.`);
        
        // Use the explicit CLIENT_ID instead of environment variable
        const data = await rest.put(
            process.env.GUILD_ID
                ? Routes.applicationGuildCommands(CLIENT_ID, process.env.GUILD_ID)
                : Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );
        
        console.log(`Successfully deployed ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error details:', error);
    }
})();
