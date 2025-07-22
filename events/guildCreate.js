const logger = require('../handlers/logger');

module.exports = {
    name: 'guildCreate',
    once: false,
    execute(guild) {
        logger.info(`Bot joined new guild: ${guild.name} (${guild.id}) with ${guild.memberCount} members`);
        
        // Attempt to send welcome message to system channel or first available text channel
        const systemChannel = guild.systemChannel;
        if (systemChannel && systemChannel.permissionsFor(guild.members.me).has('SendMessages')) {
            systemChannel.send({
                content: 'Thanks for adding Ghost Discord Bot! Use `/help` to see available commands and `/setup` to configure the blog connection.'
            }).catch(error => {
                logger.error('Failed to send welcome message', error);
            });
        } else {
            // Find first channel we can send to
            const textChannels = guild.channels.cache.filter(
                c => c.type === 0 && c.permissionsFor(guild.members.me).has('SendMessages')
            );
            
            if (textChannels.size > 0) {
                textChannels.first().send({
                    content: 'Thanks for adding Ghost Discord Bot! Use `/help` to see available commands and `/setup` to configure the blog connection.'
                }).catch(error => {
                    logger.error('Failed to send welcome message', error);
                });
            }
        }
    }
};
