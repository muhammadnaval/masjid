# Intent Statement — Flutter TV Display MVP

**Date:** 2026-08-01  
**Project:** Masjid Display (Antigravity Digital Masjid)  
**PRD Reference:** [PRD-Antigravity-Jam-Digital-Masjid_new.prd](../../PRD-Antigravity-Jam-Digital-Masjid_new.prd)

---

## 1. Summary

- **Outcome:** A standalone Flutter TV Display MVP with high-aesthetic 16:9 UI (digital clock, prayer schedule cards, media slides, running text) and an interactive demo/test control panel to preview Adzan, Iqamah countdown, and Syuruq overlays on demand.
- **User:** Mosque Jama'ah (passive TV viewers) and project developers/admins (testing and reviewing UI transitions).
- **Why now:** To visually verify and refine the TV display design and state transitions before building out the Insforge backend & web admin dashboard.
- **Success:** A running Flutter app that looks stunning on a 16:9 display, keeps real-time clock and prayer schedules, scrolls running text smoothly, and lets you toggle Adzan popup and Iqamah countdown screens instantly via demo buttons.
- **Constraint:** Built inside `/home/naval/www/masjid.test/mobile`, using Flutter, fully operational standalone with zero live backend dependency for now.
- **Out of scope:** Insforge backend server setup, PostgreSQL database integration, web Admin Dashboard, auth system, and remote device sync.

---

## 2. Key MVP Components

1. **Header Bar:**
   - Mosque Logo, Name, Address & Contact.
   - Real-time digital clock (HH:mm:ss).
   - Gregorian and Hijri dates.

2. **Main Content Area:**
   - Prayer Schedule Cards: Imsak, Subuh, Syuruq, Dzuhur/Jum'at, Ashar, Maghrib, Isya.
   - Highlight active/next prayer card with countdown timer.
   - Media Carousel / Announcement area for images, posters, text dakwah.

3. **Bottom Bar:**
   - Smooth animated running text scrolling horizontally.

4. **Overlay Screens (Triggerable via Demo Controller):**
   - Adzan Screen Overlay (Full screen notification with prayer name).
   - Iqamah Countdown Screen Overlay (Dynamic timer count down).
   - Syuruq Screen Overlay (Notification of forbidden prayer time).

5. **Demo Control Bar:**
   - Floating toggle bar for testing: Normal Mode, Adzan Mode, Iqamah Mode, Syuruq Mode, Jum'at Mode.
