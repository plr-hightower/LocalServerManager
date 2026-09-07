# Security Policy

## Supported versions

This is a hobby project maintained by one person. Only the latest release on `master` receives fixes.

## Reporting a vulnerability

**Please do not open a public GitHub issue for a security vulnerability.**

Report it privately through GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) on this repository (Security → Report a vulnerability). I'll acknowledge it as soon as I reasonably can, and I'd appreciate it if you held off on public disclosure until a fix is out or we've agreed there won't be one.

## Known and accepted design limitations

These are documented, deliberate properties of the current design, not vulnerabilities , please don't report them as such:

- **The web UI has no authentication.** Anyone who can reach the frontend can create and delete servers. Per-server manager passwords only gate management actions on a single server.
- **The backend has full access to the Docker daemon** via a mounted `/var/run/docker.sock` and runs as `root`. This is equivalent to root on the host and is required for the application's core purpose of managing containers.
- **MySQL is published on the host**, and `DB_PASSWORD` is also the database container's root password.

Consequently, this application is intended to run **only on a trusted local network**, never exposed to the internet. If you deploy it beyond that, put it behind a VPN or an authenticating reverse proxy.

Reports of *unintended* weaknesses within that threat model , path traversal in the file manager, authentication bypass of the manager password, command or SQL injection, container escape beyond the above, secrets leaking into logs , are very much wanted.
