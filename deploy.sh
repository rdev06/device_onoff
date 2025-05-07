#!/bin/bash

# Exit on any error
set -e

# Step 1: Build the project on dev
pnpm build

# Step 2: Store the current branch name and create a temp build folder
CURRENT_BRANCH=$(git branch --show-current)
TEMP_DIR=$(mktemp -d)

# Step 3: Copy build output to temporary directory
cp -r dist/* "$TEMP_DIR"
cp package.json pnpm* Readme.md .gitignore $TEMP_DIR

# Step 4: Switch to master branch
git checkout master

# Step 5: Remove old files (be careful with this in real projects!)
git rm -r . 
rm -rf *

# Step 6: Copy from temporary build folder to current directory
cp -rf "$TEMP_DIR"/* .

# Step 7: Clean up temp folder
rm -rf "$TEMP_DIR"

# Step 8: Commit and push
git add .
git commit -m "Deploy build from $CURRENT_BRANCH"
git push origin master

# Step 9: Switch back to dev
git checkout "$CURRENT_BRANCH"
