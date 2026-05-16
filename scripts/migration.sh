#!/bin/bash
set -e
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/config.sh"

# Securely pass password to prevent CLI exposure in process trees
export MYSQL_PWD="$DB_PASSWORD"

echo "Waiting for database..."
until docker compose exec database mysqladmin ping -u "$DB_USER" --silent 2>/dev/null; do
  echo "  not ready, retrying..."
  sleep 2
done
echo "Database ready"

# Ensure migrations tracking table exists
docker compose exec database mysql -u "$DB_USER" "$DB_NAME" -e "
  CREATE TABLE IF NOT EXISTS migrations (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    filename   VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
"

# Loop safely over paths (handles spaces perfectly)
for file in "$MIGRATIONS_DIR"/*.sql; do
  [ -e "$file" ] || continue
  filename=$(basename "$file")

  # Check if migration was already executed
  result=$(docker compose exec database mysql -u "$DB_USER" "$DB_NAME" -se \
    "SELECT COUNT(*) FROM migrations WHERE filename = '$filename';")

  if [ "$result" -gt "0" ]; then
    echo "Skipping $filename — already applied"
    continue
  fi

  echo "Running $filename..."
  docker compose exec -T database mysql -u "$DB_USER" "$DB_NAME" < "$file"

  # Record entry
  docker compose exec database mysql -u "$DB_USER" "$DB_NAME" -e \
    "INSERT INTO migrations (filename) VALUES ('$filename');"

  echo "$filename done"
done

echo "All migrations applied"