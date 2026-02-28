# =====================================
# Stage 1: Frontend Builder
# =====================================
FROM node:18 AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY resources ./resources
COPY public ./public
COPY vite.config.* ./
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.mjs ./

RUN npm run build


# =====================================
# Stage 2: PHP Production (Debian)
# =====================================
FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    supervisor \
    libpq-dev \
    libzip-dev \
    libonig-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_pgsql mbstring zip gd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer (clean)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy backend source
COPY . .

# Copy frontend build
COPY --from=frontend-builder /app/public/build ./public/build

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Fix permissions
RUN chown -R www-data:www-data /var/www \
    && chmod -R 755 storage bootstrap/cache

# Copy supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 9000

CMD ["/usr/bin/supervisord", "-n"]