@echo off
echo Starting MongoDB Service (requires admin)...
net start MongoDB
if %errorlevel% == 0 (
    echo MongoDB started successfully!
) else (
    echo Failed - trying to run as Administrator...
    powershell -Command "Start-Process cmd -ArgumentList '/c net start MongoDB' -Verb RunAs -Wait"
)
echo Done.
pause
