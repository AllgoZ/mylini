# 🚀 Deploying Mylini to Netlify

This guide will walk you through deploying your **Mylini Premium E-Commerce Next.js** app to Netlify. Because Next.js uses server features (like dynamic routing for `/product/[id]` and `/shop/[category]`), Netlify will automatically configure its **Next.js Runtime** to handle the server-side rendering for you.

---

## 🛠️ Step 1: Create a Production Build Locally
Before deploying, it is always a good practice to verify that your application builds perfectly without any compilation or TypeScript errors.

1. Open your terminal in the root directory: `d:\Nagul\2026\MYLINI\mylini-site\mylini-v2`
2. Run the build script:
   ```bash
   npm run build
   ```
3. Once completed successfully, you will see a compiled output confirming that all routes (static and dynamic) are prepared.

---

## 🌐 Method A: Deploy via GitHub (Recommended - Automatic Redeploys)
Linking your project to a GitHub repository is the easiest and most professional way to host on Netlify. Every time you push code updates to GitHub, Netlify will automatically build and publish them!

### 1. Initialize Git and Push to GitHub
If you haven't already pushed your code to GitHub:
1. Initialize git (if not already initialized):
   ```bash
   git init
   ```
2. Commit your code:
   ```bash
   git add .
   git commit -m "feat: premium mylini prototype with interactive pages"
   ```
3. Create a new repository on your GitHub account and copy the repository URL.
4. Link and push your local repository:
   ```bash
   git remote add origin <YOUR_GITHUB_REPO_URL>
   git branch -M main
   git push -u origin main
   ```

### 2. Connect GitHub to Netlify
1. Go to [Netlify Dashboard](https://app.netlify.com/) and log in.
2. Click the **"Add new site"** button and choose **"Import from Git"**.
3. Select **GitHub** and authorize Netlify.
4. Search for your repository name and select it.
5. Netlify will automatically detect that this is a **Next.js** project and autofill the correct settings:
   * **Build command**: `npm run build` or `next build`
   * **Publish directory**: `.next`
6. Click **"Deploy site"**. Netlify will set up a live URL for you in 1-2 minutes!

---

## ⚡ Method B: Deploy Directly via Netlify CLI (No Git required)
If you want a quick demo URL without uploading your project to GitHub first, you can deploy it directly from your terminal using the Netlify CLI.

### 1. Install Netlify CLI Globally
Open command prompt or PowerShell and run:
```bash
npm install -g netlify-cli
```

### 2. Log In to Netlify
Authenticate the CLI with your Netlify account:
```bash
netlify login
```
This will open a browser window to authorize your terminal.

### 3. Deploy the Next.js App
Run the following command to link and deploy your site:
```bash
netlify deploy --prod
```
* The CLI will ask if you want to link this directory to a new or existing site. Select **"Create & configure a new site"**.
* Choose your Netlify team.
* Provide a site name (e.g. `mylini-premium-demo`) or press Enter for a random name.
* **IMPORTANT**: When prompted for the "Publish directory", type: **`.next`** (Netlify Next.js runtime will configure server-side handlers automatically).

Your site will build and a live production link will be provided in the terminal output!

---

## 💡 Pro-Tips for Next.js on Netlify
* **Asset Optimization**: Next.js custom `<Image>` components are supported out-of-the-box. Netlify automatically spins up an image optimization function.
* **Custom Domain**: You can add your custom domain (like `mylini.com`) easily from the Netlify site configuration dashboard for free under the *Domain Management* settings.
