# ibaxai Android app (Google Play)

A Trusted Web Activity: the Play Store app opens https://www.ibaxai.com/app full screen, so every
website update reaches the app without a new store release. Config: `twa-manifest.json`
(package `com.ibaxai.app`). Checklist: `docs/PLAY-STORE-LAUNCH.md` (B2, B3).

## Build (after the Play developer account exists)

Needs Node, JDK 17 and the Android SDK (Bubblewrap can download both on first run).

```bash
npm i -g @bubblewrap/cli
cd android
bubblewrap update --manifest twa-manifest.json   # generates the Android project from the config
bubblewrap build                                  # → app-release-bundle.aab (upload to Play)
```

The first `build` asks to create the **upload key** (`ibaxai-upload.keystore`). The owner keeps that
file and its passwords safe and private — never commit them, never paste them in chat. In Play
Console turn on **Play App Signing** (Google keeps the real signing key).

## Link the app to the website (no browser bar)

1. Play Console → **Setup → App signing** → copy the **SHA-256 certificate fingerprint** of the app
   signing key (and of the upload key, for testing).
2. Vercel → project `my-project-98t4` → Settings → Environment Variables →
   `ANDROID_SHA256_FINGERPRINTS` = the fingerprints, comma-separated → redeploy.
3. Check https://www.ibaxai.com/.well-known/assetlinks.json shows them.

## New version

Raise `appVersionCode` (and `appVersionName`) in `twa-manifest.json`, then `bubblewrap update` and
`bubblewrap build`. Only needed for app-shell changes (icon, name, colors) — not for website updates.
