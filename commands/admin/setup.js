/**
 * Setup Command
 * Configures Ghost blog API connection for a server
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');
const logger = require('../../handlers/logger');
const ghostApi = require('../../ghostApi');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configure Ghost blog connection for this server')
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Ghost blog URL (e.g. https://demo.ghost.io)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('key')
                .setDescription('Content API key from Ghost admin settings')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('announcements')
                .setDescription('Enable automatic post announcements in a channel')
                .setRequired(false))
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Channel to post updates to (required if announcements are enabled)')
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
        const url = interaction.options.getString('url');
        const apiKey = interaction.options.getString('key');
        const enableAnnouncements = interaction.options.getBoolean('announcements') || false;
        const channel = interaction.options.getChannel('channel');
        const role = interaction.options.getRole('role');
        const mode = interaction.options.getString('mode') || 'new_and_updated';
        
        // Defer reply since API validation might take a moment
        await interaction.deferReply({ ephemeral: true });
        
        // If announcements are enabled, channel is required
        if (enableAnnouncements && !channel) {
            await interaction.editReply('Error: You must specify a channel when announcements are enabled.');
            return;
        }
        
        // Validate channel if provided
        if (channel) {
            // Validate channel is text-based
            if (!channel.isTextBased()) {
                await interaction.editReply('Error: Selected channel must be a text channel.');
                return;
            }
            
            // Validate that bot has permissions in the channel
            if (!channel.permissionsFor(interaction.client.user).has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
                await interaction.editReply('Error: I need permissions to view the channel, send messages, and embed links in the selected channel.');
                return;
            }
        }
        
        // Test Ghost API connection
        try {
            const isValid = await ghostApi.validateConnection(url, apiKey);
            if (!isValid) {
                await interaction.editReply('Error: Could not connect to Ghost blog with provided URL and API key. Please check your settings and try again.');
                return;
            }
            
            // Save configuration to database
            const guildConfig = {
                url: url,
                apiKey: apiKey,
                announcementsEnabled: enableAnnouncements,
                channelId: channel?.id || null,
                roleId: role?.id || null,
                mode: mode
            };
            
            db.setGuildConfig(guildId, guildConfig);
            
            // If announcements are enabled, log channel info
            if (enableAnnouncements && channel) {
                logger.info(`Guild ${guildId} setup with announcements: ${url} -> #${channel.name}`);
            } else {
                logger.info(`Guild ${guildId} setup for content discovery only: ${url}`);
            }
            
            // Build response message
            let responseContent = `✅ Setup complete!\n\n**Blog URL:** ${url}\n**Announcements:** ${enableAnnouncements ? 'Enabled' : 'Disabled'}`;
            
            if (enableAnnouncements && channel) {
                responseContent += `\n**Post Channel:** ${channel}`;
                responseContent += `\n**Notification Role:** ${role ? role : 'None'}`;
                responseContent += `\n**Mode:** ${mode === 'new_only' ? 'New posts only' : 'New and updated posts'}`;
                responseContent += `\n\nPosts will now be automatically shared to ${channel}.`;
            } else {
                responseContent += `\n\nThe bot is now set up for content discovery. Use the \`/search\` and \`/tag\` commands to find posts.`;
                responseContent += `\n\nYou can enable announcements later by using the \`/edit-setup announcements\` command.`;
            }
            
            // Fetch and store existing post IDs to prevent reposting old content
            if (enableAnnouncements) {
                try {
                    const existingPosts = await ghostApi.getRecentPosts(url, apiKey, 25); // Get last 25 posts
                    if (existingPosts && existingPosts.length > 0) {
                        logger.info(`Storing ${existingPosts.length} existing post IDs for guild ${guildId}`);
                        
                        for (const post of existingPosts) {
                            db.setPostAsPublished(
                                post.id, 
                                guildId, 
                                new Date(post.published_at).getTime(), 
                                new Date(post.updated_at).getTime()
                            );
                        }
                        
                        responseContent += `\n\n*Note: ${existingPosts.length} existing posts have been indexed to prevent duplicate announcements.*`;
                    }
                } catch (indexError) {
                    logger.error(`Error indexing existing posts for guild ${guildId}`, indexError);
                    // Non-critical error, continue with setup
                }
            }
            
            await interaction.editReply({
                content: responseContent
            });
        } catch (error) {
            logger.error(`Setup error for guild ${guildId}`, error);
            await interaction.editReply('There was an error connecting to the Ghost blog. Please verify your URL and API key are correct.');
        }
    },
};
