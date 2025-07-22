# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-07-22
### Added
- Category-based command handling architecture (admin, general, search)
- New handlers directory with specialized modules for improved organization
- Centralized event handling system for better maintainability
- Comprehensive logging system with file output using winston
- Error handling for uncaught exceptions and unhandled rejections
- `/announcements` command to toggle announcement functionality on/off
- `/status` command to view current bot configuration
- Secure API key storage with SHA-256 hashing
- Automatic API key migration from plaintext to secure hashed format
- Optional announcement mode allowing blog tracking without channel posts
- Extended permission support for future feature development

### Changed
- Refactored main index.js for cleaner structure
- Improved error reporting with detailed context
- Enhanced startup sequence with better initialization checks
- Improved date formatting in post embeds to show precise timestamps
- Enhanced `/test-run` command feedback with clearer results
- Updated documentation to clarify Content API usage (vs Admin API)
- Made announcement channels optional during setup
- Improved README with detailed features and configuration options
- Updated permission integer to support future features (1127001566080064)

### Fixed
- Potential memory leaks from unhandled rejections
- Better error messages for users across all commands
- Fixed SQLite3 binding error in test-run command
- Improved `/remove` command to provide feedback when no configuration exists
- Resolved Discord API authentication issues with CLIENT_ID handling

## [1.0.0] - 2025-07-21
### Added
- Initial public release of Ghost Discord Bot
- Automatic posting of new and updated Ghost blog articles every 5 minutes
- Per-server configuration with SQLite database
- Role-based pinging for notifications
- Color-coded embeds for new (green) and updated (yellow) posts
- Search posts by title and browse by tag (with autocomplete)
- `/setup` command for easy configuration
- `/edit-setup` command for granular settings management
- `/test-run` command for manual post checking
- `/remove` command for data privacy and server removal
- `/ping` and `/ping-ghost` commands for diagnostics
- `/help` command with full command list
- Rich presence: "Watching Ghost Blogs"
- Global and guild-specific command deployment support
- Comprehensive error handling and permission checks
- Example environment file and .gitignore
- MIT License, Code of Conduct, Terms of Service, Privacy Policy

### Changed
- Improved database performance with indexes
- Added support for role pinging in notifications
- Enhanced date formatting in embeds
- Updated help command to reflect all features

### Security
- Admin-only access for sensitive commands
- Data privacy controls via `/remove` command
- Open source code for full transparency
- Enhanced API key security with SHA-256 cryptographic hashing
- Runtime memory protection for sensitive credentials
- API key validation at multiple security layers
- Clear documentation on using Content API keys only (never Admin API keys)

---

Older changes and future updates will be added here as the project evolves.
