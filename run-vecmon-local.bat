@echo off
setlocal
title VecMon - Admin local
color 0B
cd /d "%~dp0develop\VecMon"

if not exist "server.py" (
  echo.
  echo ERROR: no se encuentra develop\VecMon\server.py
  pause
  exit /b 1
)

rem El servidor queda ligado a esta consola y se detiene al cerrarla.
start "VecMon server" /b py server.py

:pulse
cls
echo.
echo       V   V  EEEEE  CCCCC  M   M  OOOOO  N   N
echo       V   V  E      C      MM MM  O   O  NN  N
echo       V   V  EEEE   C      M M M  O   O  N N N
echo        V V   E      C      M   M  O   O  N  NN
echo         V    EEEEE  CCCCC  M   M  OOOOO  N   N
echo.
echo                 V E C M O N
echo.
echo       VECMON IS ALIVE
echo       Local admin: http://localhost:5055
echo       CLOSE THIS WINDOW TO STOP VECMON
echo.
timeout /t 30 /nobreak >nul
goto pulse
