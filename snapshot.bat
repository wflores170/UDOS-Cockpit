@echo off
setlocal

set SNAPSHOT_DIR=snapshots\v3.2.0-core-golden

if not exist "%SNAPSHOT_DIR%" (
    mkdir "%SNAPSHOT_DIR%"
)

copy index.html "%SNAPSHOT_DIR%\"
copy grok_zones.js "%SNAPSHOT_DIR%\"
copy maps.js "%SNAPSHOT_DIR%\"
copy inputs.js "%SNAPSHOT_DIR%\"
copy README.md "%SNAPSHOT_DIR%\"

echo Snapshot saved to %SNAPSHOT_DIR%