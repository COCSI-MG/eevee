#!/bin/bash
set -e

# Initialize Postgres database if not already initialized
if [ ! -s "/var/lib/postgresql/data/PG_VERSION" ]; then
  echo "Initializing Postgres database..."
  # Adjust path if PostgreSQL version differs
  su - postgres -c "export PATH=/usr/lib/postgresql/14/bin:\$PATH && initdb -D /var/lib/postgresql/data"
fi

# Start the Postgres server in the background
echo "Starting Postgres..."
su - postgres -c "postgres -D /var/lib/postgresql/data" &
sleep 5

# Start the Node.js API
echo "Starting Node API..."
npm run start:prod