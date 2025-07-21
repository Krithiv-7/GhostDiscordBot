const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { checkPosts } = require('../scheduler.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test-run')
        .setDescription('Manually triggers a check for new posts.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        await interaction.reply({ content: 'Manually triggering a check for new posts...', ephemeral: true });
        checkPosts(interaction.client);
    },
};
