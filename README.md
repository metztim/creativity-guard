# Creativity Guard

A Chrome extension (Manifest V3) that encourages mindful usage of AI tools and social media by prompting you to think independently first, and enforcing healthy time boundaries on distracting websites.

## Features

### 🧠 AI Tool Mindfulness (Optional)
Shows a gentle reminder when you're about to use popular AI tools, encouraging you to think through the problem yourself first:
- Detects new conversations on AI platforms
- Displays "Think First" modal with brainstorming prompts
- Tracks usage statistics (thoughtful vs. bypassed interactions)
- Supports ChatGPT, Claude, Gemini, Poe, TypingMind, and Lex

### ⏰ Social Media Time Management (Enabled by default)
Helps you stay focused during productive hours with time-based blocking:
- Blocks access to social media outside configured hours (default: 3 PM - 7 PM)
- Requires reason input before bypassing blocks
- Tracks bypass frequency and reasons
- Weekend blocking mode
- Vacation mode for temporary suspension
- Supports LinkedIn, Twitter/X, and Facebook

### 📰 News Site Control (Optional)
Block news sites with the same time-management features as social media.

### 🎯 Custom Site Blocking
Add any website to your personal blocklist with custom time restrictions.

## Installation

### From Source
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the `extension-dev` folder from this repository
6. The extension is now installed!

## Usage

### Social Media Blocking (Default)
1. Visit LinkedIn, Twitter, or Facebook outside allowed hours
2. A blocking modal will appear with your personalized settings
3. Choose to either:
   - **Bypass Guard**: Provide a reason for why you need access now
   - **Get Inspired Instead**: Redirect to your configured inspiration site

### AI Mindfulness (Enable in Settings)
1. Open the extension popup and enable "AI Think First"
2. Navigate to any supported AI tool (ChatGPT, Claude, etc.)
3. When you start a new conversation, a modal appears
4. Choose:
   - **I Did My Own Thinking**: Proceed to AI with tracked thoughtful usage
   - **Skip to AI**: Bypass the reminder (tracked separately)

### Configuration
Click the extension icon in your toolbar to:
- Configure allowed hours for social media access
- Enable/disable AI mindfulness features
- Add custom sites to block
- Set your redirect URL
- View usage statistics
- Toggle weekend blocking
- Enable vacation mode

## Supported Sites

### AI Tools
- ChatGPT (chat.openai.com, chatgpt.com)
- Claude (claude.ai)
- Google Gemini (gemini.google.com)
- Poe (poe.com)
- TypingMind (typingmind.com)
- Lex (lex.page)

### Social Media (Default)
- LinkedIn (linkedin.com)
- Twitter/X (twitter.com, x.com)
- Facebook (facebook.com)

### News Sites (Optional)
- The Guardian
- NY Times
- Washington Post
- BBC
- CNN
- Reddit

## Technical Details

- **Manifest Version**: V3 (latest Chrome extension standard)
- **Permissions**: Storage, Tabs (for tracking), Management (for disable detection)
- **Storage**: Uses `chrome.storage.session` with `sessionStorage` fallback for CSP-restricted sites
- **Content Security Policy**: Handles strict CSP environments gracefully (LinkedIn, Twitter)
- **Session Detection**: Smart detection of new vs. continuing conversations

## Privacy

This extension:
- Stores all data locally in your browser
- Does not collect or transmit any data
- Does not track your browsing outside configured sites
- Does not require any accounts or external services

## Development

### Project Structure
```
creativity-guard/
├── extension-dev/          # Active development folder
│   ├── manifest.json       # Extension configuration
│   ├── content.js          # Main content script
│   ├── background.js       # Service worker
│   ├── popup.html/js       # Extension popup UI
│   ├── sites.json          # Site configurations
│   └── icons/              # Extension icons (PNG)
├── extension/              # Production build (managed by release agent)
├── docs/                   # Documentation and session logs
└── agents/                 # Automation agents

```

### Building
No build process required - this is a pure JavaScript Chrome extension.

1. Make changes in `extension-dev/`
2. Reload extension in `chrome://extensions/`
3. Test changes
4. Use release agent to copy to `extension/` for distribution

### Contributing
Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes in `extension-dev/`
4. Test thoroughly
5. Submit a pull request

## Why This Extension?

While AI tools and social media are powerful resources, they can reduce our ability to think creatively and maintain focus. Creativity Guard helps build habits of:
- Independent problem-solving before reaching for AI
- Mindful social media usage within healthy time boundaries
- Self-awareness about bypass patterns and reasons
- Productive deep work during peak hours

## Known Issues

- AI blocking is disabled by default (requires manual enabling in settings)
- Session state doesn't persist across browser restarts (by design)
- Chrome internal pages (like new tab) may show harmless fallback logs in console

## Future Enhancements

See [docs/roadmaps/](docs/roadmaps/) for planned features:
- Enhanced analytics and insights
- Customizable blocking schedules per day
- Focus session integration
- Export statistics
- Progressive blocking (increase delay with frequency)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Credits

Created to promote mindful tech usage and independent thinking in the age of AI.

---

**Note**: This extension is designed to help, not hinder. All features can be bypassed with intentional reasoning, promoting self-awareness rather than restriction.
