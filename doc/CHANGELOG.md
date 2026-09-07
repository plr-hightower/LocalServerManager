# Changelog

## [Unreleased]

### Added
- Added Readme
- Added License
- Added Securty and contributing
- Added .env.example documenting every environment variable.
- Added a footer showing the version, license, and a source-code link.
- Added Ko-fi sponsor button (.github/FUNDING.yml).

### Fixed

### Changed

## [0.5.8] 5 September 2026

### Added
- Added themes that are stored in local storage.
- Added Name and Icon (finally).
- Added 5 themes.

### Fixed

### Changed

## [0.5.7] 20 August 2026

### Added

### Fixed

### Changed

## [0.5.6] 11 August 2026

### Added

- Added gregtech new horizons servers to minecraft manifest.
- Added 12 GB of ram option to support big modpacks.

### Fixed

### Changed
- Now 80% of allocated ram will be used in the minecraft jvm

## [0.5.5] 29 July 2026

### Added

### Fixed

### Changed

## [0.5.4] 29 July 2026

### Added

### Fixed
- File size to large to upload

### Changed

## [0.5.3] 29 July 2026

### Added

### Fixed
-Making orphan containers is now fixed

### Changed

## [0.5.2] 29 July 2026

### Added

### Fixed
- Image for specific minecraft does not load at runtime, fixed.

### Changed

## [0.5.1] 28 July 2026

### Added
- Forge, NeoForge and Quilt server types.
- Selectable Java version.
- Loader version pinning.
- Recreate server, keeps the world.
- Apply Settings button to edit an existing server.

### Fixed
- Heap now follows the allocated RAM instead of the image default of 1GB.
- Older servers no longer break on new settings.
- Retrying a failed recreate no longer conflicts.
- Max players no longer drifts.

### Changed
- Creating a server no longer starts it.
- Image tag follows the Java version.

## [0.5.0] 28 July 2026

### Added
- Folder upload in the file view, alongside single-file upload.
- Version number under the nav title, taken from the released package version.
- Now true or false are checkboxes.
- File viewing and uploading, so by extention mod support
- Text logging
- Delete server button
- Password auth for important actions
- Better error handeling
- Env ommition as it always should have been
- Create server
- Port checking and reusing

### Fixed

- Better download files
- Better health check
- Fixed slow downloads for world files

### Changed
- Nav title renamed from "Hightower" to "To be named".

### Removed
- Removed seq.

## [0.4.4] 20 July 2026

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