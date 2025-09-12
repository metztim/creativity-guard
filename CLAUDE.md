# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Creativity Guard is a Chrome extension (Manifest V3) that encourages users to think independently before using AI tools. It intercepts interactions with AI chat interfaces and social media platforms, showing reminders and enforcing time-based restrictions.

## Key Architecture

### Extension Components
- **content.js**: Main content script injected into AI and social media sites. Handles modal display, input detection, and blocking logic. Uses a safe storage wrapper to handle Chrome API edge cases.
- **background.js**: Service worker for message passing between content scripts and extension storage
- **popup.js/popup.html**: Extension popup UI with two tabs - AI usage stats and social media time restrictions

### Storage Structure
The extension uses Chrome's local storage with these key structures:
- `creativityGuardStats`: Tracks AI usage (thoughtFirstCount, bypassCount, aiUsageCount)
- `creativityGuardSessions`: Session tracking for new conversation detection
- `creativityGuardSocialMedia`: Social media blocking settings (enabled flags, allowed hours, redirect URL)
- `socialMediaSettings`: Legacy settings (being migrated to creativityGuardSocialMedia)

### Supported Sites
- AI Tools: ChatGPT, Claude, Gemini, Bard, Poe, TypingMind, Lex
- Social Media: LinkedIn, Twitter/X, Facebook

## Development Commands

Since this is a Chrome extension without a build process:
- **Test changes**: Reload the extension in `chrome://extensions/` after modifying files
- **Debug**: Use Chrome DevTools on the target page for content script debugging
- **View logs**: Check the service worker logs in chrome://extensions/ for background.js debugging

## Important Implementation Details

### Storage Wrapper Pattern
The content script uses a custom storage wrapper (lines 17-113 in content.js) with retry logic to handle Chrome API disconnection issues, particularly important for Claude.ai where the extension context can become invalid.

### Modal Display Logic
- AI sites: Shows reminder modal on input focus if it's a new conversation
- Social media: Shows blocking modal outside allowed hours with countdown timer
- Vacation mode: Completely blocks social media access when enabled

### Session Detection
Uses URL patterns and session storage to detect new AI conversations vs continuing existing ones, preventing repetitive popups in the same conversation.