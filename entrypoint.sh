#!/bin/sh

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  WARNING: .env file is missing! API keys may not be available for the frontend if pre-configured."
  echo "You can copy .env.example to .env and fill in your keys if you want them to be available."
fi

# If LOCAL_UID and LOCAL_GID are passed, fix permissions and run as that user
if [ -n "$LOCAL_UID" ] && [ -n "$LOCAL_GID" ]; then
  # modify the node user to match the host UID/GID
  groupmod -g "$LOCAL_GID" node || true
  usermod -u "$LOCAL_UID" -g "$LOCAL_GID" node || true
  
  # Ensure the anonymous volume for node_modules is owned by node
  mkdir -p /app/node_modules
  chown -R node:node /app/node_modules
  
  # Execute the passed command as the node user
  exec runuser -u node -- "$@"
else
  # Execute the passed command as root
  exec "$@"
fi
