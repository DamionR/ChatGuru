#!/bin/bash
# organize_project.sh
# This script reorganizes the ChatGuru project structure according to the following plan:
# 1. Create dedicated folders for authentication pages and standalone content pages.
# 2. Move all authentication-related files (signin.html, signup.html, reset-password.html, update-password.html, profile.html)
#    from the root into the "auth" folder.
# 3. Move content pages (e.g. about.md, contact.html) from the root into the "pages" folder.
# 4. Ensure the default layout file (default.html) is located in the _layouts folder.
#
# Run this script from the project root: /Users/damionrashford/ChatGuru

set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting project reorganization..."

# Step 1: Create required directories if they don't already exist
declare -a dirs=("auth" "pages")
for d in "${dirs[@]}"; do
  if [ ! -d "$d" ]; then
    echo "Creating directory: $d"
    mkdir -p "$d"
  else
    echo "Directory already exists: $d"
  fi
done

# Step 2: Move authentication pages into the "auth" folder
declare -a auth_pages=("signin.html" "signup.html" "reset-password.html" "update-password.html" "profile.html")
for file in "${auth_pages[@]}"; do
  if [ -f "$file" ]; then
    echo "Moving $file to auth/ folder..."
    mv "$file" "auth/"
  else
    echo "File $file not found in root; it may already be in the auth folder."
  fi
done

# Step 3: Move standalone content pages into the "pages" folder
declare -a content_pages=("about.md" "contact.html")
for file in "${content_pages[@]}"; do
  if [ -f "$file" ]; then
    echo "Moving $file to pages/ folder..."
    mv "$file" "pages/"
  else
    echo "File $file not found in root; it may already be organized."
  fi
done

# Step 4: Move default layout file to _layouts if it's in the root directory
if [ -f "default.html" ]; then
  echo "Moving default.html to _layouts/ folder..."
  mv "default.html" "_layouts/"
else
  echo "default.html not found in root; ensure _layouts/default.html exists."
fi

echo "Project reorganization complete."
