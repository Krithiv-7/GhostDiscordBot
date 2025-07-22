/**
 * Test Run Command
 * Manually triggers the post check process
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPosts } = require('../../scheduler');
const logger = require('../../handlers/logger');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('test-run')
        .setDescription('Manually triggers a check for new posts')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
        
    async execute(interaction) {
        logger.info(`Manual post check triggered by ${interaction.user.tag} in ${interaction.guild.name}`);
        
        await interaction.reply({ 
            content: 'Manually checking for new posts... This may take a moment.', 
            ephemeral: true 
        });
        
        try {
            // Run the post check process
            const result = await checkPosts(interaction.client, interaction.guild.id, true);
            
            // Inform user of result
            if (result && result.checked) {
                await interaction.followUp({ 
                    content: `✅ Check complete!\n\n📊 Results:\n- New posts found: ${result.newPosts || 0}\n- Updated posts found: ${result.updatedPosts || 0}\n- Posts sent to channel: ${result.sent || 0}`, 
                    ephemeral: true 
                });
            } else {
                await interaction.followUp({ 
                    content: '✅ Check complete! No new content was found to post.', 
                    ephemeral: true 
                });
            }
        } catch (error) {
            logger.error(`Error in manual post check`, error);
            await interaction.followUp({ 
                content: `❌ An error occurred during the check: ${error.message}`, 
                ephemeral: true 
            });
        }
    },
};
