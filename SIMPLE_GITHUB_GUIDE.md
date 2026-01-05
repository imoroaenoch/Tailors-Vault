# Simple GitHub Setup - Step by Step

## What is GitHub?
GitHub is like Google Drive for code. It stores your project online so you can:
- Save your work in the cloud
- Access it from anywhere
- Share it with others
- Never lose your code

---

## STEP 1: Install Git (The Tool You Need)

**What is Git?** Git is the tool that talks to GitHub.

### How to Install:
1. Open your web browser
2. Go to: **https://git-scm.com/download/win**
3. Click the big download button
4. Run the downloaded file (it will be called something like `Git-2.xx.x-64-bit.exe`)
5. Click "Next" through all the installation screens (default options are fine)
6. Click "Install"
7. Wait for it to finish
8. **Close and reopen your terminal/PowerShell** (important!)

### Check if it worked:
Open PowerShell and type:
```
git --version
```
If you see a version number (like `git version 2.40.0`), you're good! ✅

---

## STEP 2: Tell Git Who You Are (One Time Only)

Open PowerShell and type these two commands (replace with YOUR info):

```
git config --global user.name "John Doe"
git config --global user.email "john@example.com"
```

**Use the SAME email you'll use for GitHub!**

---

## STEP 3: Create a GitHub Account (If You Don't Have One)

1. Go to: **https://github.com**
2. Click "Sign up"
3. Enter your email, create a password, choose a username
4. Verify your email
5. You're done! ✅

---

## STEP 4: Create a New Repository on GitHub

**What is a repository?** It's like a folder on GitHub where your code lives.

### How to Create:
1. Go to **https://github.com** and sign in
2. Look at the top right corner - you'll see a **"+"** button
3. Click the **"+"** button
4. Click **"New repository"**

5. Fill in the form:
   - **Repository name:** `measurement-vault` (or any name you like)
   - **Description:** (optional) "My measurement tracking app"
   - **Public or Private:** Choose Private if you don't want others to see it
   - **IMPORTANT:** Do NOT check any boxes (no README, no .gitignore, no license)
   
6. Click the green **"Create repository"** button

7. **Copy the URL** that GitHub shows you (it will look like: `https://github.com/YOUR_USERNAME/measurement-vault.git`)
   - You'll need this in the next step!

---

## STEP 5: Connect Your Computer to GitHub

Open PowerShell and navigate to your project:

```
cd "C:\Users\HP\Measurement vault"
```

### Now run these commands one by one:

**Command 1:** Start tracking your files
```
git init
```
*(This creates a hidden folder called `.git` that tracks changes)*

**Command 2:** Tell Git about all your files
```
git add .
```
*(The `.` means "all files in this folder")*

**Command 3:** Save your files (like taking a snapshot)
```
git commit -m "First version of my app"
```
*(This saves everything as your first version)*

**Command 4:** Connect to your GitHub repository
```
git remote add origin https://github.com/YOUR_USERNAME/measurement-vault.git
```
**⚠️ REPLACE `YOUR_USERNAME` with your actual GitHub username!**

For example, if your username is `johndoe`, it would be:
```
git remote add origin https://github.com/johndoe/measurement-vault.git
```

**Command 5:** Name your main branch
```
git branch -M main
```

**Command 6:** Upload everything to GitHub
```
git push -u origin main
```

### When you run Command 6, you'll be asked for:
- **Username:** Your GitHub username
- **Password:** Use a **Personal Access Token** (not your GitHub password)

---

## STEP 6: Create a Personal Access Token (For Password)

GitHub doesn't accept passwords anymore. You need a token:

1. Go to: **https://github.com/settings/tokens**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `My Computer`
4. Check the box: **`repo`** (this gives permission to upload code)
5. Scroll down and click **"Generate token"**
6. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)
   - It will look like: `ghp_xxxxxxxxxxxxxxxxxxxx`
7. When Git asks for password, **paste this token** instead

---

## STEP 7: You're Done! 🎉

After `git push` finishes, go to your GitHub repository page and you should see all your files!

---

## Future Updates (When You Make Changes)

After you change your code, run these 3 commands to update GitHub:

```
git add .
git commit -m "What I changed"
git push
```

---

## Common Problems & Solutions

### Problem: "git is not recognized"
**Solution:** Git isn't installed. Go back to STEP 1.

### Problem: "remote origin already exists"
**Solution:** Run this first:
```
git remote remove origin
```
Then continue with Command 4.

### Problem: "Authentication failed"
**Solution:** Make sure you're using a Personal Access Token, not your password.

### Problem: "Permission denied"
**Solution:** Check that your repository name matches exactly, and you're using the right username.

---

## Visual Guide

```
Your Computer          →          GitHub
─────────────────────────────────────────
1. git init           →    (Prepares tracking)
2. git add .          →    (Selects all files)
3. git commit         →    (Saves snapshot)
4. git remote add     →    (Connects to GitHub)
5. git push           →    (Uploads to GitHub) ✅
```

---

## Need More Help?

- GitHub Help: https://docs.github.com
- Git Tutorial: https://learngitbranching.js.org

