const { ActivityType } = require('discord.js');
const scheduler = require('../scheduler');
const logger = require('../handlers/logger');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        logger.info(`Ready! Logged in as ${client.user.tag}`);
        client.user.setActivity('Ghost Blogs', { type: ActivityType.Watching });
        scheduler.start(client);
    }
};
