#!/bin/sh

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  WARNING: .env file is missing! API keys may not be available for the frontend if pre-configured."
  echo "You can copy .env.example to .env and fill in your keys if you want them to be available."
fi

# Execute the passed command (CMD)
exec "$@"
