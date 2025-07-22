# Ghost Discord Bot

A powerful Discord bot that integrates with the Ghost Content API to automatically post new and updated articles to your Discord server. Perfect for Ghost bloggers, content creators, and communities who want to stay updated with the latest posts.

## ✨ Features

### 🔄 Automatic Content Syncing
- **Real-time monitoring** - Checks for new posts every 5 minutes
- **Smart detection** - Identifies both new posts and updated existing posts
- **Duplicate prevention** - Advanced caching system prevents duplicate notifications
- **Flexible modes** - Choose between "New & Updated" or "New Posts Only"
- **Optional announcements** - Configure whether to announce posts or just track them

### 🎯 Customizable Notifications
- **Role pinging** - Optionally ping specific roles when new posts are published
- **Beautiful embeds** - Rich embeds with post title, excerpt, author, and featured image
- **Color coding** - Green embeds for new posts, yellow for updated posts
- **Precise timestamps** - Shows exact date and time of publication/updates

### 🛠️ Easy Management
- **Simple setup** - One command to get started
- **Granular editing** - Modify individual settings without full reconfiguration
- **Multi-server support** - Each Discord server has its own independent configuration
- **Admin controls** - All management commands require "Manage Server" permissions
- **Status command** - View your current bot configuration and status

### 🔍 Content Discovery
- **Search functionality** - Find posts by title across your Ghost site
- **Tag browsing** - Browse posts by tags with smart autocomplete
- **API diagnostics** - Test connectivity to your Ghost site

### 🔒 Security
- **Secure API storage** - API keys are hashed with SHA-256 before storage
- **No plaintext credentials** - Sensitive data is never stored in plaintext
- **Permission validation** - Proper checking of bot permissions in channels

## 🚀 Quick Start

### Prerequisites
- Node.js 16.0.0 or higher
- A Discord bot token from the [Discord Developer Portal](https://discord.com/developers/applications)
- A Ghost site with Content API access (Content API is read-only and safe to use)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/krithiv-7/GhostDiscordBot.git
   cd GhostDiscordBot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Discord bot credentials:
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   CLIENT_ID=your_client_id_here
   ```

4. **Deploy slash commands**
   ```bash
   node deploy-commands.js
   ```

5. **Start the bot**
   ```bash
   node index.js
   ```

### Bot Permissions

When inviting the bot to your server, make sure it has these permissions:
- `View Channels`
- `Send Messages` 
- `Manage Messages`
- `Add Reactions`
- `Embed Links`
- `Attach Files`
- `Read Message History`
- `Use Slash Commands`
- `Use External Emojis/Stickers`
- `Moderate Members`

**Permission Integer:** `1127001566080064`

### Invite Link Template
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=1127001566080064&scope=bot%20applications.commands
```

## 📖 Commands

### General Commands (Available to everyone)

| Command | Description |
|---------|-------------|
| `/ping` | Check the bot's latency |
| `/help` | Display all available commands |
| `/ping-ghost` | Test connection to your Ghost site |
| `/search <title>` | Search for posts by title |
| `/tag <tag>` | Find posts by tag (with autocomplete) |

### Admin Commands (Requires "Manage Server" permission)

| Command | Description |
|---------|-------------|
| `/setup` | Initial Ghost integration setup |
| `/edit-setup` | Edit individual configuration settings |
| `/test-run` | Manually trigger a check for new posts |
| `/remove` | Remove server configuration and data |
| `/announcements` | Toggle announcement functionality on/off |
| `/status` | View current bot configuration and status |

## ⚙️ Configuration

### Initial Setup

Use the `/setup` command to configure the bot for your server:

```
/setup api_url:https://yoursite.com api_key:your_content_api_key channel:#your-channel announcements:true mode:default ping_role:@subscribers
```

**Parameters:**
- `api_url` - Your Ghost site URL (e.g., `https://yoursite.com`)
- `api_key` - Your Ghost Content API Key
- `channel` - Discord channel where posts will be sent (optional if announcements disabled)
- `announcements` (optional) - Enable/disable announcement posts (`true`/`false`, default: `true`)
- `mode` (optional) - `default` (new & updated) or `new_only`
- `ping_role` (optional) - Role to ping when new posts are published

### Getting Your Ghost API Key

1. Go to your Ghost Admin panel
2. Navigate to **Settings** → **Integrations**
3. Click **Add custom integration**
4. Copy the **Content API Key** (not the Admin API Key)

> **Important:** Always use the Content API Key, which is read-only by design. Never use your Admin API Key with this bot.

### Editing Configuration

Use `/edit-setup` to modify individual settings:

- `/edit-setup url` - Update Ghost site URL
- `/edit-setup key` - Update API key (securely stored with SHA-256 hashing)
- `/edit-setup channel` - Change posting channel
- `/edit-setup mode` - Switch between posting modes
- `/edit-setup ping-role` - Add/remove role pinging
- `/announcements toggle` - Enable or disable post announcements

## 🏗️ Project Structure

```
GhostDiscordBot/
├── commands/               # Slash command files organized by category
│   ├── admin/             # Admin-only commands
│   │   ├── setup.js       # Initial configuration
│   │   ├── edit-setup.js  # Settings management
│   │   ├── announcements.js # Toggle announcements
│   │   ├── test-run.js    # Manual post check
│   │   ├── remove.js      # Data removal
│   │   └── ping-ghost.js  # API diagnostics
│   ├── general/          # General commands
│   │   ├── help.js       # Command help
│   │   ├── ping.js       # Latency check
│   │   └── status.js     # Bot status info
│   └── search/          # Search-related commands
│       ├── search.js    # Post search
│       └── tag.js       # Tag browsing
├── handlers/            # Event and command handling
│   ├── mainHandler.js   # Main initialization
│   ├── commandHandler.js # Command processing
│   ├── eventHandler.js  # Event management
│   └── logger.js        # Logging system
├── database.js          # SQLite database management with secure storage
├── ghostApi.js          # Ghost Content API integration
├── ghostApiSecure.js    # Secure API handling
├── deploy-commands.js   # Command deployment script
├── index.js             # Main bot file
├── scheduler.js         # Automatic post checking
├── package.json         # Dependencies
├── .env.example         # Environment template
├── .gitignore           # Git exclusions
└── README.md            # This file
```

## 🗄️ Database

The bot uses SQLite to store:
- **Server configurations** - Securely hashed API keys, channels, settings per Discord server
- **Published posts cache** - Prevents duplicate notifications
- **Optimized indexes** - Fast queries even with large datasets
- **Automated migrations** - Smooth transitions between versions

Database file: `ghost.db` (automatically created in the `data` directory)

## 🔧 Development

### Running in Development Mode

For faster testing during development, you can use guild-specific commands:

1. Add your guild ID to `.env`:
   ```env
   GUILD_ID=your_guild_id_here
   ```

2. Modify `deploy-commands.js` to use guild commands:
   ```javascript
   Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
   ```

Guild commands update instantly, while global commands can take up to an hour.

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/krithiv-7/GhostDiscordBot/issues) page
2. Create a new issue with detailed information
3. Include your Ghost version and any error messages

## 🙏 Acknowledgments

- Built with [discord.js](https://discord.js.org/)
- Powered by [Ghost Content API](https://ghost.org/docs/content-api/)
- Database powered by [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- Logging system with [winston](https://github.com/winstonjs/winston)
- Security with Node.js [crypto](https://nodejs.org/api/crypto.html) module

---

**Made with ❤️ for the Ghost Community**
