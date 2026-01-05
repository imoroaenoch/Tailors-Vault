# GitHub Setup Guide for Measurement Vault

Follow these steps to connect your project to GitHub and push your code.

## Step 1: Install Git (if not installed)

1. Download Git from: https://git-scm.com/download/win
2. Run the installer with default settings
3. Restart your terminal/command prompt after installation

## Step 2: Verify Git Installation

Open PowerShell or Command Prompt and run:
```bash
git --version
```

You should see a version number like `git version 2.x.x`

## Step 3: Configure Git (First time only)

Set your name and email (replace with your GitHub credentials):
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 4: Initialize Git Repository

Navigate to your project folder and run:
```bash
cd "C:\Users\HP\Measurement vault"
git init
```

## Step 5: Add All Files

```bash
git add .
```

## Step 6: Create Initial Commit

```bash
git commit -m "Initial commit: Measurement Vault app with Supabase integration"
```

## Step 7: Create GitHub Repository

1. Go to https://github.com and sign in (or create an account)
2. Click the "+" icon in the top right → "New repository"
3. Repository name: `measurement-vault` (or your preferred name)
4. Description: "A web app for tailors to record and manage client measurements"
5. Choose **Public** or **Private**
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 8: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
git remote add origin https://github.com/YOUR_USERNAME/measurement-vault.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

## Step 9: Push Your Code

If you haven't already pushed, run:
```bash
git push -u origin main
```

You may be prompted for your GitHub username and password (or personal access token).

## Important: Environment Variables

⚠️ **NEVER commit your Supabase keys!**

Your `.gitignore` file is already configured to exclude `.env` files. Make sure you:

1. Create a `.env` file (if you don't have one) with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```

2. **DO NOT** commit this file - it's already in `.gitignore`

3. For deployment, you'll need to add these as environment variables in your hosting platform

## Future Updates

After making changes, use these commands to push updates:

```bash
git add .
git commit -m "Description of your changes"
git push
```

## Troubleshooting

### If Git asks for credentials:
- Use a Personal Access Token instead of password
- Generate one at: https://github.com/settings/tokens
- Select "repo" scope

### If you get "remote origin already exists":
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/measurement-vault.git
```

### If you need to update .gitignore:
```bash
git rm -r --cached .
git add .
git commit -m "Update .gitignore"
```

## Next Steps

After pushing to GitHub, you can:
- Share your repository with others
- Set up GitHub Pages for hosting
- Use GitHub Actions for CI/CD
- Collaborate with others

