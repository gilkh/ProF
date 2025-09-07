# 🌍 Global Hosting Setup Guide

## 🚀 SUPER QUICK START (30 seconds)

### Option A: Automatic Setup (Recommended)
1. **Double-click `setup-ngrok.bat`** - Downloads ngrok automatically
2. **Sign up free** at ngrok.com (opens automatically)
3. **Copy your authtoken** from the dashboard
4. **Run:** `ngrok.exe authtoken YOUR_TOKEN`
5. **Double-click `host-global-simple.bat`** - You're live globally! 🌍

### Option B: Manual Setup
1. Download ngrok from [ngrok.com/download](https://ngrok.com/download)
2. Extract `ngrok.exe` to your ProF project folder
3. Sign up free at [ngrok.com](https://ngrok.com)
4. Run: `ngrok.exe authtoken YOUR_TOKEN`
5. Double-click `host-global-simple.bat`

## 📁 Files Available

1. **`setup-ngrok.bat`** - 🆕 Auto-downloads ngrok (run this first!)
2. **`host-global-simple.bat`** - Quick & easy global hosting
3. **`host-global.bat`** - Full-featured with monitoring
4. **`GLOBAL_HOSTING_SETUP.md`** - This guide

## 🔧 What Each File Does

### `setup-ngrok.bat` (🆕 New!)
- ✅ Downloads ngrok automatically
- ✅ Tests installation
- ✅ Opens signup page
- ✅ Shows clear next steps

### `host-global-simple.bat` 
- ✅ Auto-detects ngrok location
- ✅ Downloads ngrok if missing
- ✅ Starts your app and tunnel
- ✅ Shows public URL

## 🎯 Super Simple Usage

### First Time Setup:
1. **Double-click `setup-ngrok.bat`**
2. **Sign up free** at ngrok.com (page opens automatically)
3. **Copy authtoken** from dashboard
4. **Run:** `ngrok.exe authtoken YOUR_TOKEN`

### Every Time After:
1. **Double-click `host-global-simple.bat`**
2. **Wait 10 seconds** for everything to start
3. **Copy the public URL** from ngrok window
4. **Share worldwide!** 🌍

## Important Notes

- ⚠️ Keep both windows open for global access
- ⚠️ Free ngrok has a visitor warning page (users click "Visit Site")
- ⚠️ Your URL changes each time you restart ngrok
- ✅ Your app will be accessible from anywhere in the world
- ✅ All features work the same as local development

## 🆘 Troubleshooting

### ❌ "'ngrok' is not recognized"
**Solution:** Run `setup-ngrok.bat` first! It downloads ngrok automatically.

### ❌ "authtoken not set"
**Solution:** 
1. Sign up free at ngrok.com
2. Copy your authtoken
3. Run: `ngrok.exe authtoken YOUR_TOKEN`

### ❌ "ngrok.exe not found"
**Solution:** Make sure ngrok.exe is in your ProF folder (same as your .bat files)

### ❌ "Port already in use"
**Solution:** The batch file handles this automatically, or restart your computer

## Pro Tips

- Use `host-global-simple.bat` for quick demos
- Use `host-global.bat` for longer development sessions
- The ngrok URL is shareable immediately
- Test your app locally first at http://localhost:9002

## Free Tier Limits
- Ngrok free tier includes:
  - ✅ HTTPS tunnels
  - ✅ Global access
  - ⚠️ 1 online tunnel at a time
  - ⚠️ Visitor warning page
  - ⚠️ 2-hour session limit (just restart)

Perfect for development, demos, and sharing your work!