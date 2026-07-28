#!/bin/bash
set -e
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/config.sh"

echo "Waiting for database..."
# Fix 1: Explicitly pass the host variable into the container environment using -e
until docker compose exec -T -e MYSQL_PWD="$DB_PASSWORD" database mysqladmin ping -u "$DB_USER" --silent 2>/dev/null; do
  echo "  not ready, retrying..."
  sleep 2
done
echo "Database ready"

# Ensure migrations tracking table exists
docker compose exec -T -e MYSQL_PWD="$DB_PASSWORD" database mysql -u "$DB_USER" "$DB_NAME" -e "
  CREATE TABLE IF NOT EXISTS migrations (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    filename   VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
"

for file in "$MIGRATIONS_DIR"/*.sql; do
  [ -e "$file" ] || continue
  filename=$(basename "$file")

  # Fix 2: -T prevents TTY pollution, -e passes password, tr strips the carriage returns (\r)
  result=$(docker compose exec -T -e MYSQL_PWD="$DB_PASSWORD" database mysql -u "$DB_USER" "$DB_NAME" -se \
    "SELECT COUNT(*) FROM migrations WHERE filename = '$filename';" | tr -d '\r')

  if [ -z "$result" ]; then
    result=0
  fi

  if [ "$result" -gt 0 ]; then
    echo "Skipping $filename , already applied"
    continue
  fi

  echo "Running $filename..."
  # Fix 3: -T allows standard input redirection (<) to stream your migration file smoothly
  docker compose exec -T -e MYSQL_PWD="$DB_PASSWORD" database mysql -u "$DB_USER" "$DB_NAME" < "$file"

  # Record entry
  docker compose exec -T -e MYSQL_PWD="$DB_PASSWORD" database mysql -u "$DB_USER" "$DB_NAME" -e \
    "INSERT INTO migrations (filename) VALUES ('$filename');"

  echo "$filename done"
done

echo "All migrations applied"