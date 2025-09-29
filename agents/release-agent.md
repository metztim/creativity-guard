# Release Agent

This agent automates the release process for the Creativity Guard Chrome extension.

## Purpose
Copies the development version from `extension-dev/` to `extension/` and creates a timestamped zip file for distribution.

## Trigger
When the user says: "Run the release agent" or "Create a new release"

## Process

### 1. Pre-release Checks
- Verify that `extension-dev/` exists and contains necessary files
- Check that manifest.json is valid JSON
- Confirm sites.json is valid JSON

### 2. Get Release Information
Ask the user for:
- Version number (if different from current)
- Brief release notes (optional)

### 3. Clean Production Folder
- Remove all contents from `extension/` folder
- Ensure folder exists and is empty

### 4. Copy Files to Production
Copy from `extension-dev/` to `extension/`:
- manifest.json (with updated version if provided)
- content.js
- background.js
- popup.html
- popup.js
- sites.json
- INSTALL.txt
- icons/ folder and all contents

### 5. Create Release Zip
- Generate timestamp: YYYYMMDD-HHMM format (e.g., 20250929-1041)
- Create zip file: `docs/zips/{timestamp} creativity-guard-extension.zip`
- Include only the `extension/` folder contents in the zip
- Exclude: .DS_Store, __MACOSX, and any hidden files

### 6. Update Documentation
If version was changed:
- Update version in extension/manifest.json
- Create or append to CHANGELOG.md with release notes

### 7. Verification
- List the created zip file with size
- Show summary of files included
- Confirm successful completion

### 8. Git Commit (Optional)
Ask user if they want to commit the release:
- Commit message: "Release v{version} - {timestamp}"
- Include changed files in extension/ and the new zip

## Error Handling
- If extension-dev/ is missing files, list what's missing
- If JSON files are invalid, show the error
- If zip creation fails, provide error details
- Never proceed with partial releases

## Output Format
```
🚀 Release Agent Starting...
✓ Pre-release checks passed
✓ Production folder cleaned
✓ Files copied to extension/
✓ Zip created: docs/zips/20250929-1041 creativity-guard-extension.zip (50KB)
✓ Version updated to: 1.0.1

📦 Release Complete!
Ready for distribution: docs/zips/20250929-1041 creativity-guard-extension.zip
```

## Important Notes
- Always work from `extension-dev/` as source
- Never modify files directly in `extension/` outside this process
- Maintain timestamp format for easy sorting
- Keep all release zips in `docs/zips/` for version history