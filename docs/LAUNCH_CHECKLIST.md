# Launch checklist

## Before the first TestFlight build
- [ ] Apple Developer Program joined; Paid Apps agreement, tax and banking done
- [ ] `app.json` → `ios.bundleIdentifier` changed from the placeholder `com.compite.app`
- [ ] `src/lib/config.ts` → real `SUPPORT_EMAIL` and `PRIVACY_POLICY_URL`
- [ ] Privacy policy (`docs/PRIVACY_POLICY.md`) filled in and hosted (e.g. GitHub Pages)
- [ ] App icon `assets/icon.png` (1024×1024, no transparency) and `assets/splash-icon.png` replaced
- [ ] Name checked on the App Store, the web, trademark databases and domains

## Test on a real iPhone (development or TestFlight build)
- [ ] Onboarding: skip notifications → app works; Settings shows how to enable later
- [ ] Reminder at a set time fires with the phone locked; tapping opens Today
- [ ] Reminders still fire after restarting the phone and after changing time zone
- [ ] Quiet hours 22:00–07:00 → nothing in that window
- [ ] Daily max 3 with 6 habits → only 3 per day
- [ ] Editing a habit's time cancels the old reminder; deleting a habit removes its reminders
- [ ] Deny notification permission → kind message + "Open Settings"
- [ ] Check-in twice in one day edits the same entry
- [ ] Log 120 consecutive flow days (use "also log the days before") → no limit, calendar fine
- [ ] Insights with zero data and with lots of data
- [ ] PDF 30/60/90 days opens in Mail/Files, nothing cut off
- [ ] CSV export opens in Numbers/Sheets
- [ ] Face ID lock: fail → stays locked; passcode fallback works
- [ ] Delete all my data → empty app, back to onboarding, no reminders pending
- [ ] Airplane mode: everything works
- [ ] Largest Dynamic Type, VoiceOver, dark mode, Reduce Motion, smallest iPhone

## Submit
- [ ] Listing copy, keywords, screenshots (`docs/APP_STORE_LISTING.md`)
- [ ] App Privacy: Data Not Collected; age rating questionnaire
- [ ] Price tier set; "Manually release" selected
- [ ] Review notes pasted
