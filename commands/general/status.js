/**
 * Status Command
 * Shows current Ghost bot configuration for the server
 */
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database');
const logger = require('../../handlers/logger');
const ghostApi = require('../../ghostApi');

module.exports = {
    category: 'general',
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Shows the current Ghost blog configuration status'),
        
    async execute(interaction) {
        const guildId = interaction.guild.id;
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            // Get guild config
            const config = db.getGuildConfig(guildId);
            
            if (!config) {
                return interaction.editReply('This server has not been configured yet. An administrator can set it up using `/setup`.');
            }
            
            // Check connection to Ghost API
            const connectionValid = await ghostApi.validateConnection(config.url, config.apiKey);
            
            // Create status embed
            const embed = new EmbedBuilder()
                .setColor(connectionValid ? 0x00FF00 : 0xFF0000)
                .setTitle('Ghost Discord Bot Status')
                .addFields(
                    { name: 'Blog URL', value: config.url || config.apiUrl, inline: true },
                    { name: 'API Connection', value: connectionValid ? '✅ Connected' : '❌ Failed', inline: true }
                )
                .setFooter({ text: `Server ID: ${guildId}` })
                .setTimestamp();
            
            // Add announcements status fields
            const announcementsEnabled = config.announcementsEnabled !== undefined
                ? config.announcementsEnabled
                : !!config.channelId;
                
            embed.addFields({
                name: 'Announcements',
                value: announcementsEnabled ? '✅ Enabled' : '❌ Disabled',
                inline: true
            });
            
            if (announcementsEnabled) {
                // Add channel info if announcements enabled
                const channelId = config.channelId;
                let channelInfo = 'Not set';
                
                if (channelId) {
                    try {
                        const channel = await interaction.guild.channels.fetch(channelId);
                        channelInfo = channel ? `${channel} (#${channel.name})` : `Unknown (ID: ${channelId})`;
                    } catch (e) {
                        channelInfo = `Cannot access (ID: ${channelId})`;
                    }
                }
                
                embed.addFields(
                    { name: 'Post Channel', value: channelInfo, inline: false }
                );
                
                // Add role ping info if set
                const roleId = config.roleId;
                if (roleId) {
                    try {
                        const role = await interaction.guild.roles.fetch(roleId);
                        embed.addFields({ 
                            name: 'Notification Role', 
                            value: role ? `${role} (@${role.name})` : `Unknown (ID: ${roleId})`, 
                            inline: true 
                        });
                    } catch (e) {
                        embed.addFields({ 
                            name: 'Notification Role', 
                            value: `Cannot access (ID: ${roleId})`, 
                            inline: true 
                        });
                    }
                }
                
                // Add mode info
                const mode = config.mode === 'new_only' ? 'New posts only' : 'New and updated posts';
                embed.addFields({ name: 'Announcement Mode', value: mode, inline: true });
            }
            
            logger.debug(`Status command used by ${interaction.user.tag} in ${interaction.guild.name}`);
            
            // Add command help
            let helpText = 'Commands: ';
            helpText += '`/search` to find posts, ';
            helpText += '`/tag` to browse posts by tag';
            
            if (announcementsEnabled) {
                helpText += ', `/announcements` to configure announcements';
            } else {
                helpText += '\n\nAnnouncements are disabled. An admin can enable them with `/announcements`';
            }
            
            embed.setDescription(helpText);
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            logger.error(`Error in status command for guild ${guildId}`, error);
            await interaction.editReply('An error occurred while retrieving the bot status.');
        }
    },
};
