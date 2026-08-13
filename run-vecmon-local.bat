@echo off
title VecMon - Admin local
color 0B
echo.
echo   +--------------------------------------------------+
echo   ^|                                                  ^|
echo   ^|       V   V  EEEEE  CCCCC  M   M  OOOOO  N   N   ^|
echo   ^|       V   V  E      C      MM MM  O   O  NN  N   ^|
echo   ^|       V   V  EEEE   C      M M M  O   O  N N N   ^|
echo   ^|        V V   E      C      M   M  O   O  N  NN   ^|
echo   ^|         V    EEEEE  CCCCC  M   M  OOOOO  N   N   ^|
echo   ^|                                                  ^|
echo   ^|   [###]  Serving!                               ^|
echo   ^|   [###]  Local:   http://localhost:5055         ^|
echo   ^|   [## ]  Admin:   snippet editor online        ^|
echo   ^|   [#  ]  Close this window to stop VecMon       ^|
echo   ^|                                                  ^|
echo   +--------------------------------------------------+
echo.
echo   VecMon - editor local de snippets
echo.
cd /d "%~dp0develop\VecMon"
py server.py
