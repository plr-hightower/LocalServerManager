# Layers a fix on top of barumel/docker-astroneer-server: the upstream
# entrypoint.sh has a bug where `wait -n; [ "$?" -ge 0 ] || kill ...` can
# never trigger the kill branch (exit codes are never negative), so a crashed
# game server process leaves the container hanging forever instead of
# exiting and letting Docker's restart policy recover it. See entrypoint.sh
# in this directory for the full explanation and the fix.
FROM barumel/docker-astroneer-server:latest

# The base image runs as a non-root 'steam' user by default, which can't
# chmod a root-owned system path — switch to root just for this, then back.
USER root
COPY entrypoint.sh /usr/bin/entrypoint.sh
RUN chmod +x /usr/bin/entrypoint.sh
USER steam
