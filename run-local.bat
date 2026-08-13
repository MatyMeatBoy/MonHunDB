@echo off
setlocal
cd /d "%~dp0"

echo Iniciando VecMon en http://localhost:5055 ...
start "VecMon" cmd /k call "%~dp0run-vecmon-local.bat"

echo Iniciando Bestiario en http://localhost:3000 ...
start "MonHunDB local" cmd /k call "%~dp0run-monhundb-local.bat"

timeout /t 2 /nobreak >nul
start "" http://localhost:3000/
