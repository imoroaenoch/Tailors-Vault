# Push Your Code to GitHub - Exact Commands

Your repository is ready at: **https://github.com/imoroaenoch/measurement-vault**

Run these commands **in your PowerShell window** (one by one):

---

## Step 1: Navigate to Your Project

```bash
cd "C:\Users\HP\Measurement vault"
```

---

## Step 2: Check if Git is Initialized

```bash
git status
```

**If you see:** "not a git repository" → Go to Step 3
**If you see:** file list → Skip to Step 5

---

## Step 3: Initialize Git (If Not Done)

```bash
git init
```

---

## Step 4: Configure Git (If Not Done)

```bash
git config --global user.name "imoroaenoch"
git config --global user.email "jakiejake08@gmail.com"
```

---

## Step 5: Add Remote Connection

```bash
git remote add origin https://github.com/imoroaenoch/measurement-vault.git
```

**If you get "remote origin already exists":**
```bash
git remote remove origin
git remote add origin https://github.com/imoroaenoch/measurement-vault.git
```

---

## Step 6: Add All Your Files

```bash
git add .
```

---

## Step 7: Create Commit

```bash
git commit -m "Add Measurement Vault app files"
```

---

## Step 8: Set Main Branch

```bash
git branch -M main
```

---

## Step 9: Push to GitHub

```bash
git push -u origin main
```

**When prompted:**
- **Username:** `imoroaenoch`
- **Password:** Use your **Personal Access Token** (not your GitHub password)

### If You Don't Have a Token Yet:

1. Go to: **https://github.com/settings/tokens**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Note: `Measurement Vault`
4. Check: **`repo`** (full control of private repositories)
5. Click **"Generate token"**
6. **Copy the token** (starts with `ghp_`)
7. Paste it when Git asks for password

---

## Step 10: Verify It Worked

Go to: **https://github.com/imoroaenoch/measurement-vault**

You should see all your files! ✅

---

## Troubleshooting

### "Authentication failed"
- Make sure you're using a Personal Access Token, not your password
- Token must have `repo` permission

### "Permission denied"
- Make sure you're signed in to GitHub
- Check that the repository name is exactly: `measurement-vault`

### "Updates were rejected"
If the repository has a README.md that you don't have locally:
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

## After Success! 🎉

Your code is now on GitHub! You can:
- View it online at: https://github.com/imoroaenoch/measurement-vault
- Share the link with others
- Access it from any computer
- Never lose your code!

