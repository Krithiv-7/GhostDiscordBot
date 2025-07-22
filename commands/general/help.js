/**
 * Help Command
 * Displays information about available bot commands
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../../handlers/logger');

module.exports = {
    category: 'general',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View information about available commands')
        .addStringOption(option => 
            option.setName('command')
                .setDescription('Get help for a specific command')
                .setRequired(false)
                .setAutocomplete(true)),
    
    async execute(interaction) {
        const commandName = interaction.options.getString('command');
        const client = interaction.client;
        
        // If a specific command was requested
        if (commandName) {
            const command = client.commands.get(commandName);
            if (!command) {
                return interaction.reply({
                    content: `Command \`${commandName}\` not found.`,
                    ephemeral: true
                });
            }
            
            // Create embed for specific command
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(`/${command.data.name} Command`)
                .setDescription(command.data.description)
                .addFields(
                    { name: 'Category', value: command.category || 'Uncategorized', inline: true }
                );
                
            // Add options if any
            if (command.data.options && command.data.options.length > 0) {
                embed.addFields(
                    { name: 'Options', value: command.data.options.map(option => 
                        `\`${option.name}\`: ${option.description} ${option.required ? '*(required)*' : ''}`
                    ).join('\n')}
                );
            }
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        // Show general help with categories
        const commands = client.commands;
        
        // Group commands by category
        const categories = {};
        commands.forEach(command => {
            const category = command.category || 'Uncategorized';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(command);
        });
        
        // Create main help embed
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('Ghost Discord Bot Help')
            .setDescription('Use `/help <command>` for detailed information about a specific command.');
        
        // Add each category and its commands
        Object.keys(categories).sort().forEach(category => {
            const commandList = categories[category]
                .map(cmd => `\`/${cmd.data.name}\`: ${cmd.data.description}`)
                .join('\n');
                
            embed.addFields({ name: `📌 ${category.charAt(0).toUpperCase() + category.slice(1)} Commands`, value: commandList });
        });
        
        embed.setFooter({ text: 'For blog setup, use /setup command (admin only)' });
        
        logger.debug(`Help command used by ${interaction.user.tag}`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
    },
    
    // Handle autocomplete for command names
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const choices = interaction.client.commands.map(command => command.data.name);
        const filtered = choices.filter(choice => choice.startsWith(focusedValue));
        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice }))
        );
    }
};
