@echo off
setlocal
title MonHunDB - servidor local
color 0E
cd /d "%~dp0"

rem El servidor queda ligado a esta consola; al cerrar la ventana Windows
rem termina tambien el proceso hijo y no queda escuchando en segundo plano.
start "MonHunDB server" /b npx serve . -l 3000

:pulse
cls
echo.
echo       M   M  OOOOO  N   N  H   H  U   U  N   N
echo       MM MM  O   O  NN  N  H   H  U   U  NN  N
echo       M M M  O   O  N N N  HHHHH  U   U  N N N
echo       M   M  O   O  N  NN  H   H  U   U  N  NN
echo       M   M  OOOOO  N   N  H   H  UUUUU  N   N
echo.
echo                 M O N H U N D B
echo.
echo       MONHUNDB IS ALIVE
echo       Local server: http://localhost:3000
echo       CLOSE THIS WINDOW TO STOP THE LOCAL SERVER
echo.
timeout /t 30 /nobreak >nul
goto pulse
