/**
 * Remove Command
 * Removes all bot configuration data for the server
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');
const logger = require('../../handlers/logger');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Removes all Ghost bot data for this server')
        .addBooleanOption(option =>
            option.setName('confirm')
                .setDescription('Confirm you want to remove all bot data')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const guildName = interaction.guild.name;
        const confirm = interaction.options.getBoolean('confirm');
        
        if (!confirm) {
            return interaction.reply({
                content: '❌ Action cancelled. No data was removed.',
                ephemeral: true
            });
        }
        
        try {
            // Get guild config first to show what's being removed
            const config = db.getGuildConfig(guildId);
            
            // Check if there's any configuration to remove
            if (!config) {
                return interaction.reply({
                    content: '❌ No configuration found for this server. Please use the `/setup` command first to configure the bot.',
                    ephemeral: true
                });
            }
            
            // Remove all guild data from database
            db.removeGuild(guildId);
            
            logger.info(`Guild configuration removed: ${guildName} (${guildId}) by ${interaction.user.tag}`);
            
            // Build response message
            let responseContent = '✅ All bot configuration for this server has been successfully removed.\n\n';
            
            responseContent += `**Removed Configuration:**\n`;
            responseContent += `• Blog URL: ${config.url || config.apiUrl}\n`;
            
            if (config.announcementsEnabled !== undefined ? config.announcementsEnabled : !!config.channelId) {
                responseContent += `• Announcement Channel: ${config.channelId ? `<#${config.channelId}>` : 'None'}\n`;
            }
            
            responseContent += `\nYou can set up the bot again at any time using the \`/setup\` command.`;
            
            await interaction.reply({ 
                content: responseContent, 
                ephemeral: true 
            });
        } catch (error) {
            logger.error(`Error removing guild ${guildId}`, error);
            
            await interaction.reply({ 
                content: '❌ An error occurred while trying to remove the server configuration.', 
                ephemeral: true 
            });
        }
    },
};
