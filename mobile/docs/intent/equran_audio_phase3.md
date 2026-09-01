# Intent Statement — Phase 3: eQuran.id API & Audio Playback Engine

**Date:** 2026-08-01  
**Project:** Masjid Display (Antigravity Digital Masjid)  
**PRD Reference:** [PRD-Antigravity-Jam-Digital-Masjid_new.prd](../../PRD-Antigravity-Jam-Digital-Masjid_new.prd)

---

## 1. Summary

- **Outcome:** Live eQuran.id API prayer schedule synchronization (with city code selection & offline local storage fallback) and an automated audio engine playing Adzan alarms, pre-Adzan Murottal Al-Qur'an, and Dzikir Pagi/Petang using bundled MP3 assets + URL overrides.
- **User:** Mosque Jama'ah and congregants (hearing accurate prayer calls, Murottal before adzan, and Dzikir post-prayer).
- **Why now:** To make the TV display fully autonomous so it operates hands-free with accurate real-world schedules and automated audio cues.
- **Success:** Display automatically fetches eQuran.id schedules for the selected city, plays Murottal 5–10 minutes before prayer time, smoothly transitions to Adzan overlay + Adzan audio when time hits, and falls back gracefully to offline cached schedules if internet drops.
- **Constraint:** Flutter `audioplayers` package integration, eQuran.id API client with offline storage, bundled default MP3 assets in `assets/audio/`, and Insforge backend URL override support.
- **Out of scope:** Native Android TV APK compilation & hardware auto-boot installer (reserved for Phase 4 / final build).

---

## 2. Key Components to Implement

1. **Flutter Dependencies & Assets:**
   - Package: `audioplayers`
   - Assets: `assets/audio/adzan.mp3`, `assets/audio/murottal_kahfi.mp3`, `assets/audio/dzikir_pagi.mp3`, `assets/audio/dzikir_petang.mp3`

2. **eQuran.id API Schedule Sync (`lib/services/equran_service.dart`):**
   - Live endpoint: `https://api.myquran.com/v2/sholat/jadwal/{city_code}/{year}/{month}/{day}`
   - Automatic city lookup & schedule parsing.
   - Offline local JSON cache fallback.

3. **Automated Audio & State Engine (`lib/services/audio_service.dart`):**
   - Pre-Adzan Murottal trigger (5-10 mins before prayer time).
   - Auto-stop Murottal when Adzan time hits.
   - Adzan overlay + audio playback trigger.
   - Transition to Iqamah countdown overlay after Adzan screen duration.
   - Dzikir Pagi / Dzikir Petang post-prayer triggers.
