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
ENV APP_ENV=prod
ENV APP_DEBUG=0

WORKDIR /app

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction \
    && composer dump-autoload --no-dev --optimize \
    && mkdir -p var/uploads var/private \
    && php bin/console cache:warmup \
    && chmod -R 777 var/

CMD php \
    -d upload_max_filesize=50M \
    -d post_max_size=55M \
    -d memory_limit=256M \
    -S 0.0.0.0:${PORT:-8000} \
    -t public/
