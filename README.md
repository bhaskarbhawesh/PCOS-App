# Compite

A calm PCOS routine app for iPhone: pick your daily habits, get gentle reminders, log how you feel in about 10 seconds, keep a cycle log built for irregular cycles, and share a clear PDF summary with your doctor.

**Pay once. No subscription. No ads. No account. Data stays on the phone.**

Built with Expo SDK 57 (React Native 0.86) and Expo Router.

## What's in v1.0

| Area | What it does |
| --- | --- |
| Onboarding | 3 screens: welcome + disclaimer, pick starter habits (or add your own), explain reminders then ask for permission (or skip). |
| Today | Habit checklist with large tick circles, haptics, a tick animation (respects Reduce Motion), per-habit and overall streaks, reorder, check-in banner and button. |
| Habits | Starter library of generic wellness habits, custom habits, icon, type (habit / medication / supplement, names typed by the user), days of the week, up to 6 reminder times, mute, pause, delete. |
| Reminders | Local notifications only. Repeating calendar triggers (daily or weekly) so times survive time-zone and daylight-saving changes; never more than 60 pending (iOS allows 64). Global switch, quiet hours (works across midnight), daily maximum (1–10), per-habit mute, optional "hide habit names on lock screen", test notification. Tapping a reminder opens Today. |
| Check-in | Mood, energy, pain/cramps, skin, sleep (1–5, each optional) + note. One per day; reopening edits it. |
| Cycle | Month calendar, flow (none / spotting / light / medium / heavy) shown by **shape and count, not colour alone**, pain 0–4, note. No length limit, past dates, edit/delete, "also log the days before" for long stretches. No predictions and no "normal/abnormal" labels. |
| Insights | Week / month: bar chart of habits done vs scheduled, line charts for each check-in metric, plain captions ("You completed 12 of 21 habits…"), friendly empty state. |
| Doctor summary | 30 / 60 / 90 days, in-app preview, paginated PDF shared via the iOS share sheet. |
| Privacy & data | Optional Face ID / passcode lock, CSV export of everything, "Delete all my data" (wipes storage, cancels reminders, returns to onboarding), privacy policy link. |
| Polish | Light and dark mode, Dynamic Type, VoiceOver labels, 44 pt tap targets, plum/blush/sage/cream palette. |

Not included, on purpose: AI, food scanning, calorie tracking, accounts, cloud sync, analytics, ads, in-app purchases.

## Project layout

```
src/
  app/              Screens (Expo Router: every file is a route)
    (tabs)/         Today, Cycle, Insights, Settings
    habit/[id].tsx  Create / edit habit ("new" = create)
    checkin.tsx     Daily check-in (modal)
    cycle-day/      Log one day of the cycle (modal)
    settings/       Notifications, Doctor summary, Privacy & data, About
    onboarding.tsx
  components/       UI building blocks, charts, habit card, lock screen
  lib/              Pure logic, unit-tested: dates, streaks, reminder planning, insights, PDF/CSV builders, reducer
  services/         Native bits: notifications, PDF/CSV sharing, Face ID lock
  state/store.tsx   App state + on-device persistence (AsyncStorage)
  theme/            Colours (light/dark), spacing, tap-target size
docs/               Privacy policy, App Store listing copy, launch checklist
```

## Run it

```bash
npm install
npm test            # unit tests for the logic layer
npm run typecheck
npx expo start      # then press "i" for the iOS simulator (Mac) or scan the QR code
```

Reminders, Face ID and PDF sharing use native modules, so test them in a **development build** on a real iPhone rather than Expo Go:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile development --platform ios
```

## Ship it to the App Store (no Mac required)

1. Join the Apple Developer Program and sign the Paid Apps agreement.
2. In `app.json`, change `ios.bundleIdentifier` (`com.compite.app` is a placeholder) to one you own.
3. In `src/lib/config.ts`, set your real support email and privacy-policy URL.
4. Replace `assets/icon.png` (1024×1024, no transparency) and `assets/splash-icon.png` with your artwork.
5. `npx eas-cli@latest build --profile production --platform ios`
6. `npx eas-cli@latest submit --platform ios` → TestFlight → App Review.

See [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md) for the full list, [`docs/APP_STORE_LISTING.md`](docs/APP_STORE_LISTING.md) for listing copy and review notes, and [`docs/PRIVACY_POLICY.md`](docs/PRIVACY_POLICY.md) for the policy to host.

## Important

Compite is for tracking and reminders only. It does not provide medical advice, diagnosis or treatment.
