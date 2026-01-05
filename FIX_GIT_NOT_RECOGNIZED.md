# Git Not Recognized - Quick Fix

## Problem
PowerShell can't find Git even though you installed it.

## Solution: Restart PowerShell

**This is the most common fix!**

1. **Close PowerShell completely** (close the window)
2. **Open PowerShell again** (search for "PowerShell" in Windows Start menu)
3. Navigate back to your project:
   ```
   cd "C:\Users\HP\Measurement vault"
   ```
4. Test if Git works:
   ```
   git --version
   ```

If you see a version number, it worked! ✅

---

## If That Doesn't Work: Check Git Installation

### Option 1: Check if Git is installed
1. Press `Windows Key + R`
2. Type: `C:\Program Files\Git\bin\git.exe`
3. Press Enter
4. If a window opens, Git is installed but not in PATH

### Option 2: Reinstall Git with PATH option
1. Download Git again: https://git-scm.com/download/win
2. Run the installer
3. **IMPORTANT:** When you see "Adjusting your PATH environment", choose:
   - ✅ **"Git from the command line and also from 3rd-party software"**
   - (This is usually the default, but make sure it's selected)
4. Complete the installation
5. **Restart your computer** (or at least close all PowerShell windows)

---

## After Git Works

Once `git --version` shows a version number, come back and I'll help you:
1. Configure Git with your name and email
2. Initialize your repository
3. Connect to GitHub
4. Upload your code

---

## Quick Test

Open a **NEW** PowerShell window and run:
```
git --version
```

**What do you see?**
- ✅ Version number (like `git version 2.43.0`) = Good! Git works!
- ❌ Error message = Need to restart or reinstall

