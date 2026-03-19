#!/bin/sh

# Exit on error
set -e

echo "🚀 Starting Deployment Script..."

# Optimize Laravel for production
echo "📦 Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run database migrations
# Use --force because this is a production-like environment
echo "🗄️ Running Migrations and Essential Seeds..."
php artisan migrate --force
php artisan db:seed --class=RolesAndPermissionsSeeder --force
php artisan db:seed --class=ChartOfAccountsSeeder --force

# Start Apache in the foreground
echo "🔥 Starting Apache..."
exec apache2-foreground
