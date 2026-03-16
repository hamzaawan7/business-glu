# Business Glu — Deployment Guide

**Server:** DigitalOcean Droplet  
**IP Address:** 64.225.5.237  
**OS:** Ubuntu 24.04 LTS (assumed)  
**Login:** root  

---

## Table of Contents

1. [Initial Server Setup](#1-initial-server-setup)
2. [Install PHP 8.2 & Extensions](#2-install-php-82--extensions)
3. [Install MySQL](#3-install-mysql)
4. [Install Node.js 20 & npm](#4-install-nodejs-20--npm)
5. [Install Composer](#5-install-composer)
6. [Install Nginx](#6-install-nginx)
7. [Configure Firewall](#7-configure-firewall)
8. [Create Deploy User](#8-create-deploy-user)
9. [Clone the Repository](#9-clone-the-repository)
10. [Configure Environment](#10-configure-environment)
11. [Install Dependencies & Build](#11-install-dependencies--build)
12. [Set Permissions](#12-set-permissions)
13. [Database Setup](#13-database-setup)
14. [Configure Nginx](#14-configure-nginx)
15. [SSL with Let's Encrypt](#15-ssl-with-lets-encrypt)
16. [Configure Supervisor (Queue Worker)](#16-configure-supervisor-queue-worker)
17. [Configure Cron (Scheduler)](#17-configure-cron-scheduler)
18. [Multi-Tenancy Configuration](#18-multi-tenancy-configuration)
19. [Final Verification](#19-final-verification)
20. [Redeployment (Updates)](#20-redeployment-updates)
21. [Troubleshooting](#21-troubleshooting)

---

## 1. Initial Server Setup

SSH into the server:

```bash
ssh root@64.225.5.237
```

Update system packages:

```bash
apt update && apt upgrade -y
```

Set the timezone:

```bash
timedatectl set-timezone UTC
```

Install common utilities:

```bash
apt install -y curl wget git unzip software-properties-common acl
```

---

## 2. Install PHP 8.2 & Extensions

Add the PHP repository and install PHP with all required Laravel extensions:

```bash
add-apt-repository ppa:ondrej/php -y
apt update

apt install -y php8.2-fpm php8.2-cli php8.2-common php8.2-mysql \
  php8.2-xml php8.2-curl php8.2-mbstring php8.2-zip php8.2-bcmath \
  php8.2-intl php8.2-readline php8.2-gd php8.2-tokenizer \
  php8.2-fileinfo php8.2-sqlite3 php8.2-redis
```

Verify:

```bash
php -v
# Should show PHP 8.2.x
```

Update PHP-FPM settings for production:

```bash
nano /etc/php/8.2/fpm/php.ini
```

Set these values:

```ini
upload_max_filesize = 64M
post_max_size = 64M
memory_limit = 256M
max_execution_time = 60
```

Restart PHP-FPM:

```bash
systemctl restart php8.2-fpm
```

---

## 3. Install MySQL

```bash
apt install -y mysql-server
```

Secure the installation:

```bash
mysql_secure_installation
```

> When prompted:
> - Set a strong root password
> - Remove anonymous users: **Yes**
> - Disallow root login remotely: **Yes**
> - Remove test database: **Yes**
> - Reload privilege tables: **Yes**

Create the application database and user:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE business_glu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'business_glu'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON *.* TO 'business_glu'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
EXIT;
```

> **Important:** The user needs `GRANT ALL ON *.*` (with GRANT OPTION) because stancl/tenancy dynamically creates new databases for each tenant. The user must be able to `CREATE DATABASE` for tenant databases.

---

## 4. Install Node.js 20 & npm

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

Verify:

```bash
node -v   # Should show v20.x.x
npm -v    # Should show 10.x.x
```

---

## 5. Install Composer

```bash
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
```

Verify:

```bash
composer --version
```

---

## 6. Install Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

---

## 7. Configure Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

Verify:

```bash
ufw status
```

---

## 8. Create Deploy User

Create a non-root user for the application:

```bash
adduser deploy
usermod -aG www-data deploy
```

Give deploy user access to restart services (optional):

```bash
echo "deploy ALL=(ALL) NOPASSWD: /usr/sbin/service php8.2-fpm restart, /usr/sbin/service nginx restart" >> /etc/sudoers.d/deploy
```

---

## 9. Clone the Repository

Create the web directory and clone:

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/hamzaawan7/business-glu.git business-glu
cd business-glu
```

> If the repo is private, you'll need to set up an SSH key or use a personal access token:
>
> ```bash
> ssh-keygen -t ed25519 -C "deploy@64.225.5.237"
> cat ~/.ssh/id_ed25519.pub
> # Add this key to GitHub → Settings → Deploy Keys
> git clone git@github.com:hamzaawan7/business-glu.git business-glu
> ```

---

## 10. Configure Environment

```bash
cd /var/www/business-glu
cp .env.example .env
nano .env
```

Update the `.env` file with production values:

```dotenv
APP_NAME="Business Glu"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://64.225.5.237

# ─── Database (MySQL for production) ───────────────────
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=business_glu
DB_USERNAME=business_glu
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# ─── Session & Cache ──────────────────────────────────
SESSION_DRIVER=database
SESSION_DOMAIN=null
CACHE_STORE=database
QUEUE_CONNECTION=database

# ─── Mail (update with your provider) ──────────────────
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="hello@businessglu.com"
MAIL_FROM_NAME="${APP_NAME}"

VITE_APP_NAME="${APP_NAME}"
```

Generate the app key:

```bash
php artisan key:generate
```

---

## 11. Install Dependencies & Build

Install PHP dependencies (no dev packages in production):

```bash
composer install --no-dev --optimize-autoloader
```

Install Node dependencies and build frontend assets:

```bash
npm ci
npm run build
```

---

## 12. Set Permissions

```bash
cd /var/www/business-glu

# Set ownership
chown -R deploy:www-data .

# Set directory permissions
find . -type d -exec chmod 755 {} \;

# Set file permissions
find . -type f -exec chmod 644 {} \;

# Make storage and cache writable
chmod -R 775 storage bootstrap/cache

# Ensure the database directory is writable (for tenant SQLite DBs if needed)
chmod -R 775 database
```

---

## 13. Database Setup

Run central migrations:

```bash
php artisan migrate --force
```

Cache the configuration, routes, and views for production:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

Create the storage symlink:

```bash
php artisan storage:link
```

---

## 14. Configure Nginx

Create the Nginx site configuration:

```bash
nano /etc/nginx/sites-available/business-glu
```

Paste the following configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name 64.225.5.237;

    root /var/www/business-glu/public;
    index index.php;

    charset utf-8;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Max upload size
    client_max_body_size 64M;

    # Gzip compression
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_types
        application/javascript
        application/json
        application/xml
        text/css
        text/plain
        text/xml
        application/vnd.ms-fontobject
        application/x-font-ttf
        font/opentype
        image/svg+xml;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Deny access to dotfiles
    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site and test:

```bash
ln -s /etc/nginx/sites-available/business-glu /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

## 15. SSL with Let's Encrypt

> **Prerequisite:** You need a domain name pointed to `64.225.5.237`. Replace `yourdomain.com` with your actual domain.

Install Certbot:

```bash
apt install -y certbot python3-certbot-nginx
```

Obtain the certificate:

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Update the `.env` after SSL:

```bash
nano /var/www/business-glu/.env
```

```dotenv
APP_URL=https://yourdomain.com
```

Recache config:

```bash
cd /var/www/business-glu
php artisan config:cache
```

Auto-renewal is set up by default. Test it:

```bash
certbot renew --dry-run
```

---

## 16. Configure Supervisor (Queue Worker)

Install Supervisor:

```bash
apt install -y supervisor
```

Create the queue worker config:

```bash
nano /etc/supervisor/conf.d/business-glu-worker.conf
```

```ini
[program:business-glu-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/business-glu/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=deploy
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/business-glu/storage/logs/worker.log
stopwaitsecs=3600
```

Start the workers:

```bash
supervisorctl reread
supervisorctl update
supervisorctl start business-glu-worker:*
```

Verify:

```bash
supervisorctl status
```

---

## 17. Configure Cron (Scheduler)

Add the Laravel scheduler to the crontab:

```bash
crontab -e
```

Add this line:

```
* * * * * cd /var/www/business-glu && php artisan schedule:run >> /dev/null 2>&1
```

---

## 18. Multi-Tenancy Configuration

The app uses **stancl/tenancy v3.9** with a **database-per-tenant** strategy. In production with MySQL, each tenant gets its own database.

### Update Central Domains

Edit the tenancy config to include your production domain:

```bash
nano /var/www/business-glu/config/tenancy.php
```

Update the `central_domains` array:

```php
'central_domains' => [
    '64.225.5.237',        // IP access
    'yourdomain.com',      // Production domain
    'www.yourdomain.com',  // www variant
],
```

### MySQL Tenant Database Permissions

The database user created in Step 3 already has `GRANT ALL ON *.*` which allows it to create tenant databases dynamically. Each tenant database will be named `tenant{tenant_id}` based on the tenancy config prefix.

### Recache After Changes

```bash
cd /var/www/business-glu
php artisan config:cache
```

---

## 19. Final Verification

Run through these checks:

```bash
cd /var/www/business-glu

# Check PHP version
php -v

# Check that artisan works
php artisan --version

# Check database connection
php artisan db:show

# Check all migrations ran
php artisan migrate:status

# Check config is cached
php artisan config:show app.env
# Should output: production

# Check the build files exist
ls -la public/build/

# Check Nginx is running
systemctl status nginx

# Check PHP-FPM is running
systemctl status php8.2-fpm

# Check queue workers
supervisorctl status

# Test the site
curl -I http://64.225.5.237
```

Visit `http://64.225.5.237` in your browser. You should see the Business Glu welcome page.

---

## 20. Redeployment (Updates)

When pushing new code, run this on the server:

```bash
cd /var/www/business-glu

# Pull latest code
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader
npm ci
npm run build

# Run migrations
php artisan migrate --force

# Run tenant migrations (if any tenant schema changes)
php artisan tenants:migrate --force

# Clear and rebuild caches
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Restart queue workers (pick up new code)
supervisorctl restart business-glu-worker:*

# Restart PHP-FPM (clear opcache)
systemctl restart php8.2-fpm
```

You can save this as a deploy script:

```bash
nano /var/www/business-glu/deploy.sh
```

```bash
#!/bin/bash
set -e

cd /var/www/business-glu

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader

echo "📦 Installing Node dependencies..."
npm ci

echo "🔨 Building frontend assets..."
npm run build

echo "🗄️ Running migrations..."
php artisan migrate --force

echo "🏢 Running tenant migrations..."
php artisan tenants:migrate --force

echo "🧹 Clearing caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "♻️ Restarting queue workers..."
supervisorctl restart business-glu-worker:*

echo "♻️ Restarting PHP-FPM..."
systemctl restart php8.2-fpm

echo "✅ Deployment complete!"
```

Make it executable:

```bash
chmod +x /var/www/business-glu/deploy.sh
```

Run future deployments with:

```bash
/var/www/business-glu/deploy.sh
```

---

## 21. Troubleshooting

### Common Issues

**500 Internal Server Error:**
```bash
# Check Laravel logs
tail -f /var/www/business-glu/storage/logs/laravel.log

# Check Nginx error log
tail -f /var/log/nginx/error.log

# Check PHP-FPM log
tail -f /var/log/php8.2-fpm.log
```

**Permission denied errors:**
```bash
chown -R deploy:www-data /var/www/business-glu/storage
chmod -R 775 /var/www/business-glu/storage
chmod -R 775 /var/www/business-glu/bootstrap/cache
```

**Vite manifest not found:**
```bash
# Ensure the build ran successfully
cd /var/www/business-glu
npm run build
ls -la public/build/manifest.json
```

**Queue jobs not processing:**
```bash
supervisorctl status
supervisorctl restart business-glu-worker:*
tail -f /var/www/business-glu/storage/logs/worker.log
```

**Tenant database creation fails:**
```bash
# Verify MySQL user has global privileges
mysql -u root -p -e "SHOW GRANTS FOR 'business_glu'@'localhost';"
# Should show: GRANT ALL PRIVILEGES ON *.* TO ...
```

**Config/route caching issues after code change:**
```bash
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan config:cache
php artisan route:cache
```

---

## Server Specs Checklist

| Requirement      | Recommended Minimum |
|------------------|---------------------|
| RAM              | 2 GB                |
| CPU              | 1 vCPU              |
| Disk             | 25 GB SSD           |
| PHP              | 8.2+                |
| Node.js          | 20.x                |
| MySQL            | 8.0+                |
| Nginx            | Latest               |
| Ubuntu           | 22.04 or 24.04 LTS  |
