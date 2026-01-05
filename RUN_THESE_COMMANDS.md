# Run These Commands in Your PowerShell

Since Git is working in your PowerShell window, run these commands **one by one** in that window.

Make sure you're in your project folder first:
```
cd "C:\Users\HP\Measurement vault"
```

---

## Step 1: Configure Git (One Time Only)

```bash
git config --global user.name "imoroaenoch"
git config --global user.email "jakiejake08@gmail.com"
```

---

## Step 2: Initialize Your Repository

```bash
git init
```

You should see: `Initialized empty Git repository in C:/Users/HP/Measurement vault/.git/`

---

## Step 3: Add All Your Files

```bash
git add .
```

This adds all your files to Git (no output is normal).

---

## Step 4: Create Your First Commit

```bash
git commit -m "Initial commit: Measurement Vault app"
```

You should see a message about files being committed.

---

## Step 5: Create GitHub Repository

**Before Step 6, you need to create a repository on GitHub:**

1. Go to: **https://github.com**
2. Make sure you're signed in
3. Click the **"+"** button in the top right corner
4. Click **"New repository"**
5. Repository name: `measurement-vault`
6. Description: (optional) "Measurement tracking app for tailors"
7. Choose **Public** or **Private**
8. **IMPORTANT:** Do NOT check any boxes (no README, no .gitignore, no license)
9. Click **"Create repository"** (green button)

---

## Step 6: Connect to GitHub

After creating the repository, GitHub will show you a page with commands. 

**Use this command** (replace with your actual username if different):

```bash
git remote add origin https://github.com/imoroaenoch/measurement-vault.git
```

---

## Step 7: Name Your Branch

```bash
git branch -M main
```

---

## Step 8: Push to GitHub

```bash
git push -u origin main
```

**When prompted:**
- **Username:** `imoroaenoch`
- **Password:** You'll need a **Personal Access Token** (see below)

---

## Step 9: Create Personal Access Token

GitHub doesn't accept passwords anymore. You need a token:

1. Go to: **https://github.com/settings/tokens**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Note: `Measurement Vault Upload`
4. Expiration: Choose 90 days (or longer)
5. Check the box: **`repo`** (this gives permission to upload code)
6. Scroll down and click **"Generate token"**
7. **COPY THE TOKEN IMMEDIATELY** (it looks like: `ghp_xxxxxxxxxxxxxxxxxxxx`)
8. When Git asks for password, **paste this token** instead

---

## You're Done! 🎉

After `git push` completes, go to:
**https://github.com/imoroaenoch/measurement-vault**

You should see all your files! ✅

---

## If You Get Errors

### "remote origin already exists"
Run this first:
```bash
git remote remove origin
```
Then continue with Step 6.

### "Authentication failed"
- Make sure you're using the Personal Access Token, not your password
- Make sure the token has `repo` permission checked

### "Permission denied"
- Check that your repository name matches: `measurement-vault`
- Make sure you created the repository on GitHub first

---

## After This Works

To update GitHub when you make changes, just run:
```bash
git add .
git commit -m "Description of your changes"
git push
```

