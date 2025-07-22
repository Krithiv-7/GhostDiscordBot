/**
 * Edit Setup Command
 * Modifies existing Ghost blog configuration
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');
const ghostApi = require('../../ghostApi');
const logger = require('../../handlers/logger');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('edit-setup')
        .setDescription('Modifies the server\'s Ghost blog configuration')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('url')
                .setDescription('Updates the Ghost blog URL')
                .addStringOption(option => 
                    option.setName('value')
                        .setDescription('The new blog URL')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('key')
                .setDescription('Updates the Ghost Content API key')
                .addStringOption(option => 
                    option.setName('value')
                        .setDescription('The new API key')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('channel')
                .setDescription('Updates the channel for posting updates')
                .addChannelOption(option => 
                    option.setName('value')
                        .setDescription('The new channel')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('role')
                .setDescription('Updates the role to ping for new posts')
                .addRoleOption(option => 
                    option.setName('value')
                        .setDescription('The new role (leave empty to disable pings)')
                        .setRequired(false))),
        
    async execute(interaction) {
        const guildId = interaction.guild.id;
        
        // Check if guild is configured
        const config = db.getGuildConfig(guildId);
        if (!config) {
            return interaction.reply({ 
                content: 'This server has not been configured yet. Please use `/setup` first.', 
                ephemeral: true 
            });
        }
        
        // Get subcommand and value
        const subcommand = interaction.options.getSubcommand();
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            switch (subcommand) {
                case 'url': {
                    const newUrl = interaction.options.getString('value');
                    
                    // Validate URL format
                    try {
                        new URL(newUrl);
                    } catch (e) {
                        return interaction.editReply('Invalid URL format. Please enter a valid URL with http:// or https://');
                    }
                    
                    // Test connection with new URL but same API key
                    const isValid = await ghostApi.validateConnection(newUrl, config.apiKey);
                    if (!isValid) {
                        return interaction.editReply('Could not connect to Ghost blog with this URL. Please verify the URL is correct.');
                    }
                    
                    // Update config
                    config.url = newUrl;
                    db.setGuildConfig(guildId, config);
                    
                    logger.info(`Guild ${guildId} updated URL to: ${newUrl}`);
                    return interaction.editReply(`✅ Ghost blog URL updated to ${newUrl}`);
                }
                
                case 'key': {
                    const newKey = interaction.options.getString('value');
                    
                    // Test connection with current URL but new API key
                    const isValid = await ghostApi.validateConnection(config.url, newKey);
                    if (!isValid) {
                        return interaction.editReply('Invalid API key. Could not connect to Ghost blog with this key.');
                    }
                    
                    // Update config
                    config.apiKey = newKey;
                    db.setGuildConfig(guildId, config);
                    
                    logger.info(`Guild ${guildId} updated API key`);
                    return interaction.editReply(`✅ Ghost Content API key updated successfully`);
                }
                
                case 'channel': {
                    const newChannel = interaction.options.getChannel('value');
                    
                    // Validate channel is text-based
                    if (!newChannel.isTextBased()) {
                        return interaction.editReply('Error: Selected channel must be a text channel.');
                    }
                    
                    // Validate that bot has permissions in the channel
                    if (!newChannel.permissionsFor(interaction.client.user).has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
                        return interaction.editReply('Error: I need permissions to view the channel, send messages, and embed links in the selected channel.');
                    }
                    
                    // Update config
                    config.channelId = newChannel.id;
                    db.setGuildConfig(guildId, config);
                    
                    logger.info(`Guild ${guildId} updated channel to: #${newChannel.name}`);
                    return interaction.editReply(`✅ Post updates will now be sent to ${newChannel}`);
                }
                
                case 'role': {
                    const newRole = interaction.options.getRole('value');
                    
                    // Update config
                    config.roleId = newRole?.id || null;
                    db.setGuildConfig(guildId, config);
                    
                    logger.info(`Guild ${guildId} updated notification role to: ${newRole?.name || 'None'}`);
                    return interaction.editReply(`✅ Notification role ${newRole ? `updated to ${newRole}` : 'disabled'}`);
                }
                
                default:
                    return interaction.editReply('Unknown option. Please try again.');
            }
        } catch (error) {
            logger.error(`Error in edit-setup command`, error);
            return interaction.editReply('An error occurred while updating the configuration.');
        }
    },
};
