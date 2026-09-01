# Intent Statement — Phase 2: Insforge Backend & Web Admin Dashboard

**Date:** 2026-08-01  
**Project:** Masjid Display (Antigravity Digital Masjid)  
**PRD Reference:** [PRD-Antigravity-Jam-Digital-Masjid_new.prd](../../PRD-Antigravity-Jam-Digital-Masjid_new.prd)

---

## 1. Summary

- **Outcome:** Insforge PostgreSQL backend database schema, REST API endpoints, and a dedicated Web Admin Dashboard allowing mosque managers to manage mosque profile, running text, media slides, and prayer time settings from any web browser.
- **User:** Mosque administrators/pengurus (managing content via Web Admin Dashboard) and the Flutter TV Display (consuming live API data).
- **Why now:** To replace hardcoded/mock display data with dynamic, remote-controlled data managed easily through a browser without touching code.
- **Success:** Admin can log into the web dashboard, update running text or upload media slides, and the Flutter TV Display automatically reflects those updates via REST API (with offline cache fallback).
- **Constraint:** Insforge backend runtime + PostgreSQL database, dedicated Web Admin interface, and REST API contracts matching PRD-Antigravity-Jam-Digital-Masjid_new.prd.
- **Out of scope:** Multi-masjid SaaS multi-tenancy, mobile native admin app, and complex RBAC multi-role permission systems.

---

## 2. Key Components to Implement

1. **PostgreSQL Database Schema Migration (`database/schema.sql`):**
   - `mosque_profiles`
   - `prayer_locations`
   - `prayer_schedules`
   - `prayer_time_corrections`
   - `iqamah_settings`
   - `media_items`
   - `running_texts`
   - `audio_settings`
   - `donation_settings`
   - `theme_settings`
   - Seed data for default Kota Padang location & sample mosque settings.

2. **REST API Server & Service Layer:**
   - Display State API (`GET /api/v1/display/state`): Aggregates current mosque profile, date/prayer schedule with corrections, active running texts, active media items, and theme config.
   - eQuran API Schedule Fetcher & Cache Service.
   - Admin Auth & CRUD API endpoints.

3. **Web Admin Dashboard Application:**
   - Modern, responsive web interface for desktop and mobile web browsers.
   - Dashboard Overview.
   - Mosque Profile Management (Name, Address, Logo).
   - Prayer Schedule & Correction Manager.
   - Media & Announcement Carousel Manager.
   - Running Text Ticker Manager.

4. **Flutter Integration Service:**
   - Flutter HTTP API client with local JSON caching for offline resilience.
