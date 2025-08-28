[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
![Stars](https://img.shields.io/github/stars/Hupyth/hupyth_new_tab_01?style=social)
![Forks](https://img.shields.io/github/forks/Hupyth/hupyth_new_tab_01?style=social)
![Last Commit](https://img.shields.io/github/last-commit/Hupyth/hupyth_new_tab_01)
![Issues](https://img.shields.io/github/issues/Hupyth/hupyth_new_tab_01)

![CI](https://github.com/Hupyth/hupyth_new_tab_01/actions/workflows/ci.yml/badge.svg)



# 🌟 New Tab - Smart Home Page

A modern New Tab application with a full range of useful features for your browser!

## 🚀 Key Features

### 🔍 Smart Search
- Multi-tool search (Google, DuckDuckGo)
- Intelligent keyword suggestions
- Automatic search history saving

### 🌐 Instant Translation
- Quick English ↔ Vietnamese translation
- Intuitive translation interface
- One-click language swap

### 📅 Task Management
- Import to-do lists from files
- Set alarms for specific times
- Notifications when it's time to act

### 🔖 Bookmark Manager
- Easily add/remove bookmarks
- Sync with localStorage
- Automatic favicon display

### ⏰ Display Time
- Accurate digital clock
- Full date with a beautiful format
- Greeting based on the time of day

## 🛠️ Setup & Run Application

### Method 1: Automatic Run (Recommended)
```bash
# Windows - Run the file run.bat

# Double-click the file run.bat
```

### Method 2: Manual Run
```bash
# Windows - Run the file app.py

@echo off

# Create a virtual environment
echo Setting up environment...
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)

# Activate the environment
echo Activating virtual environment...
# Windows:
call venv\Scripts\activate.bat
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py

pause
```

## 👁‍🗨 Preview
![Demo New Tab](https://raw.githubusercontent.com/Hupyth/hupyth_new_tab_01/main/.github/images/screenshot.png)
