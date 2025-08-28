@echo off
echo Setting up environment...
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

pip install -r requirements.txt

cls

echo Starting Flask app...
echo.
python app.py

pause
