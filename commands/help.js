const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays a list of all available commands.'),
    async execute(interaction) {
        const helpEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Ghost Discord Bot Help')
            .setDescription('Here is a list of all the commands you can use:')
            .addFields(
                { name: '**General Commands**', value: '\u200b', inline: false },
                { name: '`/ping`', value: 'Checks the bot\'s latency.', inline: true },
                { name: '`/help`', value: 'Displays this help message.', inline: true },
                { name: '`/ping-ghost`', value: 'Tests connection to your Ghost site.', inline: true },
                { name: '`/search <title>`', value: 'Search for posts by title.', inline: true },
                { name: '`/tag <tag>`', value: 'Find posts by tag (with autocomplete).', inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
                { name: '**Admin Commands** (Requires "Manage Server")', value: '\u200b', inline: false },
                { name: '`/setup`', value: 'Initial setup for Ghost integration. Requires Ghost site URL, Content API Key, channel, and optional ping role.', inline: true },
                { name: '`/edit-setup`', value: 'Edit individual settings (url, key, channel, mode, ping-role).', inline: true },
                { name: '`/test-run`', value: 'Manually check for new/updated posts.', inline: true },
                { name: '`/remove`', value: 'Remove this server\'s configuration and data.', inline: true }
            )
            .setFooter({ text: 'The bot automatically checks for new posts every 5 minutes after setup.' });

        await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    },
};
