# AGENTS.md

## Stack

- **Backend:** Laravel 13 (PHP 8.3+) with MySQL
- **Admin Panel:** Blade + Alpine.js + Tailwind CDN
- **Display Frontend:** Flutter (TV display app)
- **API Contract:** `GET /api/display/state` returns JSON consumed by Flutter

## Conventions

- Use `AdminPanelController` for all admin page CRUD (single controller, single Blade template `admin/page.blade.php`)
- Admin auth via Laravel session cookies (`auth` middleware)
- Display API returns Flutter-compatible JSON structure
- Random content (hadith/doa) injected server-side via `RandomContentService` with 30-minute cache
