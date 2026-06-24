FROM php:8.4-cli

RUN apt-get update && apt-get install -y \
    git unzip libpq-dev libzip-dev libicu-dev \
    libonig-dev libxml2-dev libpng-dev \
    libfreetype6-dev libjpeg62-turbo-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo pdo_pgsql pgsql \
        zip intl mbstring xml gd opcache \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /app

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && mkdir -p var/uploads var/private config/jwt \
    && APP_ENV=prod php bin/console lexik:jwt:generate-keypair --overwrite \
    && APP_ENV=prod php bin/console cache:warmup \
    && chmod -R 777 var/

CMD php -S 0.0.0.0:${PORT:-8000} -t public/
