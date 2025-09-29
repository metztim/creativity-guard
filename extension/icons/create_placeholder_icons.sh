#!/bin/bash

# This script creates placeholder SVG icons for the Chrome extension
# You should replace these with proper icons later

# Create 16x16 icon
cat > icon16.svg << EOF
<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
  <rect width="16" height="16" fill="#4299e1"/>
  <text x="8" y="12" font-family="Arial" font-size="12" text-anchor="middle" fill="white">C</text>
</svg>
EOF

# Create 48x48 icon
cat > icon48.svg << EOF
<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" fill="#4299e1"/>
  <text x="24" y="36" font-family="Arial" font-size="36" text-anchor="middle" fill="white">C</text>
</svg>
EOF

# Create 128x128 icon
cat > icon128.svg << EOF
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" fill="#4299e1"/>
  <text x="64" y="96" font-family="Arial" font-size="96" text-anchor="middle" fill="white">C</text>
</svg>
EOF

# Convert SVG to PNG
echo "You will need to convert these SVG files to PNG using a tool like Inkscape or online converters."
echo "After conversion, rename them to icon16.png, icon48.png, and icon128.png respectively."
echo "For now, you can use these SVG files directly in manifest.json by changing the extensions from .png to .svg"

# Make this file executable with: chmod +x create_placeholder_icons.sh 