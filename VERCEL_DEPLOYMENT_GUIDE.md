# Vercel Deployment Guide - Gemini API Setup

**Last Updated:** June 10, 2026  
**Purpose:** Configure Gemini API key on Vercel for AI family tree generation

---

## 🎯 Quick Summary

The Family Tree application code is ready on GitHub. To enable AI family tree generation on Vercel, you need to:

1. Add `GEMINI_API_KEY` to Vercel environment variables
2. Set `AI_PROVIDER` to `gemini`
3. Redeploy the project

---

## 📋 Step-by-Step Instructions

### 1. Open Vercel Dashboard
- Go to: https://vercel.com/dashboard
- Log in with your account

### 2. Select Your Project
- Find the **familytree** project
- Click on it to open project settings

### 3. Go to Environment Variables
- Click the **Settings** tab
- Scroll down to **Environment Variables** section

### 4. Add Gemini API Key
Click **+ Add New** and fill in:

| Field | Value |
|-------|-------|
| **Name** | `GEMINI_API_KEY` |
| **Value** | `[Your Gemini API Key]` |

Then click **Save**

### 5. Add AI Provider (Optional but Recommended)
Click **+ Add New** and fill in:

| Field | Value |
|-------|-------|
| **Name** | `AI_PROVIDER` |
| **Value** | `gemini` |

Then click **Save**

### 6. Redeploy Project
- Go to the **Deployments** tab
- Find your latest deployment
- Click the **...** (three dots) menu
- Select **Redeploy**
- Wait for status to show **Ready**

---

## ✅ Verification

After deployment completes, verify it works:

1. Go to your Vercel project URL
2. Navigate to the Family Tree page
3. Click **"Auto-Generate with AI"** button
4. Enter a family description
5. Click **"Generate Family Tree"**
6. You should see the AI generating family members!

---

## 📊 Expected Results

### Before Configuration
- Error message: "AI service is not available..."
- Status code: 503

### After Configuration & Redeploy
- Error message: GONE ✅
- AI button: WORKS ✅
- Family generation: ACTIVE ✅

---

## 🔒 Security Note

- ⚠️ **NEVER** commit `.env` files to GitHub
- ✅ API keys should ONLY be in Vercel's Environment Variables
- ✅ GitHub repository stays secure without exposed credentials
- ✅ Different environments (local, staging, production) can have different keys

---

## 🆘 Troubleshooting

### Still seeing "AI service not available"
- **Solution:** Make sure you redeployed after adding environment variables
- Check that deployment status is "Ready"
- Refresh your browser (Ctrl+R)

### Deployment fails
- **Solution:** Check that variable names are EXACTLY correct (case-sensitive)
- Verify no extra spaces in values
- Try redeploying again

### AI generation returns error
- **Solution:** Check that `GEMINI_API_KEY` value is complete and correct
- Make sure `AI_PROVIDER` is set to `gemini`
- Wait a few minutes after redeploy for changes to take effect

---

## 📞 Reference Information

| Item | Details |
|------|---------|
| **GitHub Repo** | https://github.com/Smileys-Helping-hand/familytree |
| **Main Branch** | All code committed and pushed |
| **Vercel URL** | https://www.thisisourfamilytree.co.za |
| **API Endpoint** | `https://www.thisisourfamilytree.co.za/api/ai/generate-tree` |

---

## 🎓 How the AI Generation Works

1. User describes family on Family Tree page
2. Frontend sends request to `/api/ai/generate-tree`
3. Backend uses Gemini API to parse family structure
4. AI generates JSON with family members and relationships
5. Family members are created in database
6. Family tree visualization updates in real-time

---

## 📝 Application Status

| Component | Status |
|-----------|--------|
| Code on GitHub | ✅ Ready |
| Database Setup | ✅ Configured |
| Error Handling | ✅ Implemented |
| Gemini Integration | ✅ Coded |
| Vercel Deployment | ⏳ Needs env vars |

---

**Ready to go live!** Just add the environment variables and redeploy. 🚀

---

**Questions?** Check the [GitHub repository](https://github.com/Smileys-Helping-hand/familytree) or review the deployment-related documentation.
