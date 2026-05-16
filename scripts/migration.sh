#!/bin/bash
set -e
source ./scripts/config.sh

echo "Waiting for database..."
until docker compose exec database mysqladmin ping -u $DB_USER -p$DB_PASSWORD --silent 2>/dev/null; do
  echo "  not ready, retrying..."
  sleep 2
done
echo "Database ready"

docker compose exec database mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "
  CREATE TABLE IF NOT EXISTS migrations (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    filename   VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
"

for file in $(ls $MIGRATIONS_DIR/*.sql | sort); do
  filename=$(basename $file)

  result=$(docker compose exec database mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME -se \
    "SELECT COUNT(*) FROM migrations WHERE filename = '$filename';")

  if [ "$result" -gt "0" ]; then
    echo "Skipping $filename — already applied"
    continue
  fi

  echo "Running $filename..."
  docker compose exec -T database mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME < $file

  docker compose exec database mysql -u $DB_USER -p$DB_PASSWORD $DB_NAME -e \
    "INSERT INTO migrations (filename) VALUES ('$filename');"

  echo "$filename done"
done

echo "All migrations applied"