# ibaxai Android app (Google Play)

A Trusted Web Activity: the Play Store app opens https://www.ibaxai.com/app full screen, so every
website update reaches the app without a new store release. Config: `twa-manifest.json`
(package `com.ibaxai.app`). Checklist: `docs/PLAY-STORE-LAUNCH.md` (B2, B3).

## Build (after the Play developer account exists)

Needs Node, a JDK (17+) and the Android SDK (platform 35+, build-tools). minSdk is 24 (Android 7.0):
the current androidbrowserhelper library needs it.

```bash
npm i -g @bubblewrap/cli
cd android
bubblewrap update --manifest twa-manifest.json   # generates the Android project from the config
bubblewrap build                                  # → app-release-bundle.aab (upload to Play)
```

The first `build` asks to create the **upload key** (`ibaxai-upload.keystore`). The owner keeps that
file and its passwords safe and private — never commit them, never paste them in chat. In Play
Console turn on **Play App Signing** (Google keeps the real signing key).

Notes from the first build (20 Oct 2026, version 1.0.0, code 1):
- If Maven Central answers 429 (too many requests), add Google's mirror
  `maven { url "https://maven-central.storage-download.googleapis.com/maven2/" }` before `mavenCentral()`
  in the generated `build.gradle` (and replace the dead `jcenter()`).
- Without the interactive CLI: generate the project with `@bubblewrap/core` (`TwaGenerator.createTwaProject`),
  run `./gradlew bundleRelease`, then sign `app-release.aab` with `jarsigner` (SHA256withRSA) using the upload key.
- **Keep code shrinking off** (`minifyEnabled false` in the generated `app/build.gradle`). Version 1.0.0 was
  built with it on: R8 renamed an activity the manifest still pointed to, and the app crashed on launch
  ("Component class R.u does not exist in com.ibaxai.app"). Version 1.0.1 (code 2, 22 Oct) is built without it.
- Upload key SHA-256 (public, safe to share): `32:63:47:D7:D7:02:C4:9B:90:7A:80:1E:D3:22:8B:0C:85:11:24:0D:8F:76:11:86:22:34:E6:87:DA:1D:C6:85`

## Link the app to the website (no browser bar)

1. Play Console → **Setup → App signing** → copy the **SHA-256 certificate fingerprint** of the app
   signing key (and of the upload key, for testing).
2. Vercel → project `my-project-98t4` → Settings → Environment Variables →
   `ANDROID_SHA256_FINGERPRINTS` = the fingerprints, comma-separated → redeploy.
3. Check https://www.ibaxai.com/.well-known/assetlinks.json shows them.

## New version

Raise `appVersionCode` (and `appVersionName`) in `twa-manifest.json`, then `bubblewrap update` and
`bubblewrap build`. Only needed for app-shell changes (icon, name, colors) — not for website updates.
