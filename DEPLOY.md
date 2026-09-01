# Production Deployment Guide — Masjid Display

Target: `https://masjid.alihdayahsiteba.web.id`

## Requirements

- Ubuntu server with Nginx, PHP 8.3+ (PHP 8.5 recommended), PHP-FPM, MySQL, Composer, and Git
- DNS A records for the domain and `www` pointing to the server
- Database and user matching the production environment (do not commit real credentials)

## 1. Create the application directory

```bash
git clone <repository-url> /var/www/masjid.alihdayahsiteba.web.id
cd /var/www/masjid.alihdayahsiteba.web.id
git checkout main
```

## 2. Configure environment

Copy `.env.production` to `.env`, then replace the database values with the actual production credentials:

```bash
cp .env.production .env
nano .env
```

Never commit `.env`. Use a unique `APP_KEY` generated with `php artisan key:generate` if this is a new installation. Preserve the existing key when deploying an existing installation so encrypted sessions remain valid.

## 3. Install and initialize Laravel

```bash
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan optimize
```

`db:seed --force` installs the default mosque configuration and admin accounts. Review the seeder before running it against an existing database.

Change the seeded admin password immediately at `/admin/account`.

## 4. Set permissions

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R ug+rwX storage bootstrap/cache
```

## 5. Configure Nginx

Copy `production.nginx.conf` to the server and enable it:

```bash
sudo cp production.nginx.conf /etc/nginx/sites-available/masjid.alihdayahsiteba.web.id
sudo ln -s /etc/nginx/sites-available/masjid.alihdayahsiteba.web.id /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

The config expects the application at `/var/www/masjid.alihdayahsiteba.web.id` and PHP-FPM at `/run/php/php8.5-fpm.sock`. Adjust the socket path if the server uses another PHP version.

## 6. Enable HTTPS

After DNS resolves to the server, obtain a certificate:

```bash
sudo certbot --nginx -d masjid.alihdayahsiteba.web.id -d www.masjid.alihdayahsiteba.web.id
```

Confirm automatic renewal:

```bash
sudo certbot renew --dry-run
```

## 7. Verify deployment

```bash
curl -fL https://masjid.alihdayahsiteba.web.id/api/display/state
curl -I https://masjid.alihdayahsiteba.web.id/admin/login
```

Then open `/admin/login`, authenticate, and verify each admin settings page. Build the Flutter app with the production API URL:

```bash
flutter build apk --dart-define=LARAVEL_URL=https://masjid.alihdayahsiteba.web.id
```

## Updating an existing deployment

```bash
cd /var/www/masjid.alihdayahsiteba.web.id
git pull --ff-only origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize
sudo systemctl reload php8.5-fpm
sudo systemctl reload nginx
```

Do not run `db:seed` during routine updates unless intentionally resetting/updating seeded configuration.

## Operational checks

- `storage/logs/laravel.log` for application errors
- `sudo journalctl -u nginx -f` for web server errors
- `sudo journalctl -u php8.5-fpm -f` for PHP-FPM errors
- Keep `.env`, SSL private keys, and database credentials outside version control
