/**
 * Edit Announcements Command
 * Enables or disables post announcements
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');
const logger = require('../../handlers/logger');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('announcements')
        .setDescription('Enable or disable post announcements')
        .addBooleanOption(option => 
            option.setName('enabled')
                .setDescription('Enable or disable announcements')
                .setRequired(true))
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Channel to post updates to (required if enabling)')
                .setRequired(false))
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('Role to ping on new posts (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Announcement mode for posts')
                .setRequired(false)
                .addChoices(
                    { name: 'New posts only', value: 'new_only' },
                    { name: 'New and updated posts', value: 'new_and_updated' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const enableAnnouncements = interaction.options.getBoolean('enabled');
        const channel = interaction.options.getChannel('channel');
        const role = interaction.options.getRole('role');
        const mode = interaction.options.getString('mode');
        
        // Get current config
        const guildConfig = db.getGuildConfig(guildId);
        if (!guildConfig) {
            return interaction.reply({ 
                content: 'This server has not been configured yet. Please use `/setup` first.',
                ephemeral: true 
            });
        }
        
        // If enabling announcements, channel is required
        if (enableAnnouncements && !channel && !guildConfig.channelId) {
            return interaction.reply({
                content: 'Error: You must specify a channel when enabling announcements.',
                ephemeral: true
            });
        }
        
        // Validate channel if provided
        if (channel) {
            // Validate channel is text-based
            if (!channel.isTextBased()) {
                return interaction.reply({
                    content: 'Error: Selected channel must be a text channel.',
                    ephemeral: true
                });
            }
            
            // Validate that bot has permissions in the channel
            if (!channel.permissionsFor(interaction.client.user).has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
                return interaction.reply({
                    content: 'Error: I need permissions to view the channel, send messages, and embed links in the selected channel.',
                    ephemeral: true
                });
            }
        }
        
        try {
            // Update config
            const updatedConfig = {
                announcementsEnabled: enableAnnouncements
            };
            
            if (channel) {
                updatedConfig.channelId = channel.id;
            }
            
            if (role) {
                updatedConfig.roleId = role.id;
            }
            
            if (mode) {
                updatedConfig.mode = mode;
            }
            
            // Update each field individually to preserve other settings
            Object.keys(updatedConfig).forEach(key => {
                db.updateGuildSetting(guildId, key, updatedConfig[key]);
            });
            
            // Build response message
            let responseContent = enableAnnouncements
                ? '✅ Post announcements have been enabled.'
                : '✅ Post announcements have been disabled.';
                
            if (enableAnnouncements) {
                responseContent += `\n\n**Announcement Settings:**\n`;
                responseContent += `• Channel: ${channel ? channel : `<#${guildConfig.channelId}>`}\n`;
                
                const pingRole = role ? role : (guildConfig.roleId ? `<@&${guildConfig.roleId}>` : 'None');
                responseContent += `• Notification Role: ${pingRole}\n`;
                
                const modeDisplay = (mode || guildConfig.mode) === 'new_only' 
                    ? 'New posts only' 
                    : 'New and updated posts';
                responseContent += `• Mode: ${modeDisplay}`;
                
                // If we just enabled announcements, fetch and store existing post IDs
                // This prevents the bot from announcing old posts
                responseContent += `\n\n*Note: The bot is now indexing existing posts to prevent announcing old content.*`;
            }
            
            logger.info(`Guild ${guildId} announcements ${enableAnnouncements ? 'enabled' : 'disabled'} by ${interaction.user.tag}`);
            
            await interaction.reply({
                content: responseContent,
                ephemeral: true
            });
            
            // If announcements were just enabled, index existing posts
            // This is done after the reply to not keep the user waiting
            if (enableAnnouncements) {
                try {
                    const ghostApi = require('../../ghostApi');
                    const existingPosts = await ghostApi.getRecentPosts(guildConfig.url, guildConfig.apiKey, 25);
                    
                    if (existingPosts && existingPosts.length > 0) {
                        logger.info(`Indexing ${existingPosts.length} existing posts for guild ${guildId}`);
                        
                        for (const post of existingPosts) {
                            db.setPostAsPublished(
                                post.id,
                                guildId,
                                new Date(post.published_at).getTime(),
                                new Date(post.updated_at).getTime()
                            );
                        }
                    }
                } catch (indexError) {
                    logger.error(`Error indexing existing posts for guild ${guildId}`, indexError);
                    // Non-critical error, don't notify user
                }
            }
        } catch (error) {
            logger.error(`Error updating announcement settings for guild ${guildId}`, error);
            
            await interaction.reply({
                content: '❌ An error occurred while updating announcement settings.',
                ephemeral: true
            });
        }
    },
};
