@echo off
title MonHunDB - servidor local
color 0E
echo.
echo   +--------------------------------------------------+
echo   ^|                                                  ^|
echo   ^|              M O N H U N                      ^|
echo   ^|              M O N H U N                      ^|
echo   ^|              M O N H U N                      ^|
echo   ^|                                                  ^|
echo   ^|   [####]  Serving!                             ^|
echo   ^|   [####]  Local:   http://localhost:3000       ^|
echo   ^|   [### ]  Network: this machine on port 3000   ^|
echo   ^|   [##  ]  Web bestiary online                  ^|
echo   ^|   [#   ]  Close this window to stop MonHunDB   ^|
echo   ^|                                                  ^|
echo   +--------------------------------------------------+
echo.
echo   MonHunDB - servidor web local
echo.
cd /d "%~dp0"
npx serve . -l 3000
