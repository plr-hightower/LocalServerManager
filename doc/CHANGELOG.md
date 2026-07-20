# Changelog

## [Unreleased]

### Added
- Added more settings for palworld.
### Fixed

### Changed

## [0.4.3] 19 July 2026

### Added

### Fixed

### Changed

### Removed
- Removed Astroneer support.

## [0.4.2] 19 July 2026

### Added

### Fixed
- Trying to hot fix astroneer.
### Changed

## [0.4.1] 19 July 2026

### Added

### Fixed
- was not root in the new image for astroneer

### Changed

## [0.4.0] 19 July 2026

### Added

### Fixed
- fixed the docker compose not referencing proper file.
### Changed

### Deprecated

### Removed

### Security

## [0.3.1] 19 July 2026

### Added
- Added a custom Astroneer image (docker/astroneer-server/) built on top of barumel/docker-astroneer-server.

### Fixed

### Changed

### Deprecated

### Removed

### Security

## [0.3.0] 19 July 2026

### Added
- Added astroneer manifest
- Added palworld manifest
- Added new fetch all images script.

### Fixed
- game_container is now a plain VARCHAR instead of a hardcoded SQL ENUM, so adding a new game never requires a DB migration again.
- fetch_all_images.sh no longer aborts the whole run when a service file's image can't be parsed, it now correctly skips just that one game.

### Changed

### Deprecated

### Removed

### Security

## [0.2.1] 18 July 2026

### Added

### Fixed

### Changed

### Deprecated

### Removed

### Security

## [0.2.0] 18 July 2026

### Added
- Download world files added

### Fixed
- Changed the download of world files to a get for proper browser handeling.

### Changed

### Deprecated

### Removed

### Security

## [0.1.1] 18 July 2026

### Added

### Fixed

### Changed

### Deprecated

### Removed

### Security

## [0.1.0] 18 July 2026

### Added
- Added frontend
- Added server schemas 
- Added server router
- Added server controller with functions to manage the servers
- Added MySQL db and surrounding code
- Added validation service
- Added docker service
- Added a sweet of scripts to help with managing the set up and images
- Added github action pipeline to check changelog in PR's
- Added World file downloads
- Added backend testing framework
- Added different container port to app port configs for games
- Added valheim manifest
- Added dashboard for logging with dozzle and seq.
- Added checks for number of total servers, not starting servers that don't have enough free ram.
- Added versioning.

### Fixed
- Dockerfiles updated and docker compose aswell.
- Stupid release name fixed.

### Changed
- Redid the docker-compose and how everything is run 
- Cleaned up the packages, configs and dockerfiles
- Updated minecraft image
- Updated versioning to match the gitflow git workflow.

### Deprecated

### Removed
- Old front end got fully removed

### Security

## [0.0.0]  16 May 2026
### Added
- Initial commit 

### Fixed

### Changed

### Deprecated

### Removed

### Security