# Mobile Session Persistence Fix - Indefinite Login

## Problem
Users were being logged out after 1 day on the mobile APK instead of staying logged in indefinitely.

## Root Cause
1. **Firebase ID Tokens expire after 1 hour** by default
2. The app was **not refreshing the Firebase Auth token** in the background
3. When the mobile app restarted or resumed after ~1 day, the Firebase Auth state was preserved locally (via `browserLocalPersistence`), but **the server session cookie was not being renewed**
4. The session cookie had a 7-day expiration, but the Firebase ID token used to verify it was stale

## Solution Implemented

### 1. Extended Session Duration
- Changed session cookie from **7 days** to **14 days** (Firebase's maximum allowed)
- Implemented automatic refresh every **10 days** to keep the session alive **indefinitely**
- Users stay logged in **forever** unless they manually log out

### 2. Automatic Token Refresh
- **Every 10 days**: Automatically refreshes the Firebase ID token and re-establishes the session cookie
- **On app resume**: Checks if 10+ days have passed and proactively refreshes
- Uses `localStorage` to track last refresh timestamp
- Ensures the 14-day session cookie is renewed before it expires

### 3. Session Recovery on App Resume
- **On app visibility change** (when user returns to the app): Checks session validity
- **On Capacitor app state change** (when app moves to foreground): Verifies and refreshes
- If the server session has expired, automatically refreshes without requiring re-login
- If more than 10 days have passed since last refresh, proactively renews the session

### 4. Enhanced Cookie Handling

#### Client-side (`src/lib/fetch-wrapper.ts`)
- Created a fetch wrapper that adds `X-Capacitor-Platform` header to identify mobile app requests
- Ensures `credentials: 'include'` is set to send/receive cookies properly

#### Server-side (`src/app/api/auth/session/route.ts`)
- Detects Capacitor requests via user-agent or custom header
- Sets `SameSite=none` for Capacitor apps (required for cookies in embedded WebViews)
- Sets `SameSite=lax` for regular web browsers
- Creates 14-day session cookies (Firebase maximum)

#### Android WebView (`android/app/src/main/java/com/tradecraft/app/MainActivity.java`)
- Added aggressive cookie persistence in `onPause()`, `onStop()`, and `onDestroy()` lifecycle methods
- Ensures cookies are flushed to disk when app goes to background or is destroyed

### 5. Capacitor Configuration (`capacitor.config.ts`)
- Set `androidScheme: 'https'` to ensure cookies work properly with HTTPS servers
- Enabled `allowMixedContent: true` for flexibility during development

## Files Changed

1. **src/hooks/use-auth.ts** - Automatic token refresh, app resume handling, and refresh tracking
2. **src/lib/fetch-wrapper.ts** - New file: Fetch wrapper with Capacitor headers
3. **src/app/api/auth/session/route.ts** - Dynamic SameSite cookie attribute & 14-day expiration
4. **android/app/src/main/java/com/tradecraft/app/MainActivity.java** - Enhanced cookie persistence
5. **capacitor.config.ts** - Updated Android configuration

## How It Works

### Initial Login
1. User logs in → Firebase Auth creates a user session
2. ID token is sent to `/api/auth/session`
3. Server creates a session cookie with **14-day expiration**
4. Cookie is stored in the WebView's cookie storage
5. Current timestamp is saved to `localStorage.lastSessionRefresh`

### Automatic Refresh (Every 10 Days)
1. Background timer triggers every 10 days
2. Calls `refreshSessionCookie()`:
   - Gets fresh ID token: `user.getIdToken(true)`
   - Sends to `/api/auth/session`
   - Server creates new 14-day session cookie
   - Updates `lastSessionRefresh` timestamp
3. This keeps the session alive **indefinitely**

### App Resume (After Being Backgrounded)
1. `visibilitychange` event or Capacitor `appStateChange` fires
2. Checks `lastSessionRefresh` timestamp
3. If more than 10 days have passed:
   - Automatically calls `refreshSessionCookie()`
   - Renews the session before the 14-day cookie expires
4. If session expired for any reason:
   - Re-establishes session automatically
   - No re-login required

### Manual Logout
1. User clicks logout button
2. Calls `/api/auth/logout` to clear server session
3. Calls `auth.signOut()` to clear Firebase Auth
4. Clears `lastSessionRefresh` from localStorage
5. Cleans up all timers and listeners

## Session Lifecycle

```
Day 0:  User logs in → 14-day cookie created
Day 10: Auto-refresh → New 14-day cookie created (expires Day 24)
Day 20: Auto-refresh → New 14-day cookie created (expires Day 34)
Day 30: Auto-refresh → New 14-day cookie created (expires Day 44)
...continues indefinitely until manual logout
```

## Testing Checklist

- [ ] Log in on mobile APK
- [ ] Keep app open for several hours (session persists)
- [ ] Close app and reopen after 1 day (session persists)
- [ ] Close app and reopen after 1 week (session persists)
- [ ] Close app and reopen after 2 weeks (session persists)
- [ ] Close app and reopen after 1 month (session persists)
- [ ] Close app and reopen after 6 months (session persists)
- [ ] Check console logs for refresh messages
- [ ] Manually log out → verify full logout
- [ ] Verify no unexpected logouts during normal usage

## Additional Notes

### Session Will Persist Indefinitely Unless:
1. User manually logs out
2. User clears app data/cache
3. Firebase Auth account is disabled by admin
4. User doesn't open the app for more than 14 days (session expires before next refresh)

### Why 10 Days + 14 Days?
- Firebase session cookies have a **maximum duration of 14 days**
- We refresh every **10 days** to have a **4-day safety buffer**
- Even if the user opens the app on day 13, the refresh happens and extends the session
- As long as the app is opened at least once every 14 days, the session stays alive forever

### Mobile vs Web
- **Mobile (Capacitor)**: Uses `SameSite=none` for proper cookie handling in WebView
- **Web**: Uses `SameSite=lax` for standard browser security
- Both have the same indefinite session behavior
