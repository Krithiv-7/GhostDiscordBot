const logger = require('../handlers/logger');
const db = require('../database');

module.exports = {
    name: 'guildDelete',
    once: false,
    execute(guild) {
        logger.info(`Bot removed from guild: ${guild.name} (${guild.id})`);
        
        // Clean up guild data from database
        try {
            db.removeGuild(guild.id);
            logger.info(`Removed guild ${guild.id} from database`);
        } catch (error) {
            logger.error(`Failed to remove guild ${guild.id} from database`, error);
        }
    }
};
