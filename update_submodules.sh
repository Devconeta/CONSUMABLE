#!/bin/bash

# Fetch the latest changes for all submodules
git submodule foreach 'git fetch origin && git checkout main && git pull origin main'

# Stage the updated submodule references
git add .

# Commit the changes
git commit -m "Update all submodules to the latest commit on their respective branches"

# Push the changes to the remote repository
git push origin main
