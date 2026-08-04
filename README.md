# Развёртывание

## Подключение

```bash
ssh root@IP
```

---

## Подготовка сервера

```bash
apt update
apt upgrade -y

apt install nginx git curl certbot python3-certbot-nginx -y

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -

apt install nodejs -y

node -v
npm -v
```

---

## Загрузка проекта

### Через Git

```bash
mkdir -p /var/www/panorama-site

cd /var/www/panorama-site

git clone https://github.com/DmitriiSvarovskii/panorama-site.git

cd panorama-site
```

---

## Сборка проекта

```bash
npm install

npm run build

ls dist
```

---

## Настройка Nginx

### Формат диагностического лога

```bash
nano /etc/nginx/conf.d/panorama-client-log.conf
```

```nginx
log_format panorama_client '$time_iso8601 ip=$remote_addr host=$host '
                           'status=$status method=$request_method uri="$request_uri" '
                           'rt=$request_time referer="$http_referer" ua="$http_user_agent"';
```

```bash
nano /etc/nginx/sites-available/panorama
```

```nginx
server {
    listen 80;
    server_name panorama-agency.ru www.panorama-agency.ru;

    root /var/www/panorama-site/panorama-site/dist;
    index index.html;

    location / {
        add_header Cache-Control "no-cache";
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    location /slides-webp/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    location /files/ {
        add_header Cache-Control "public, max-age=86400";
        try_files $uri =404;
    }

    location = /client-log {
        access_log /var/log/nginx/panorama-client.log panorama_client;
        add_header Cache-Control "no-store";
        return 204;
    }
}
```

### Ротация диагностического лога

```bash
nano /etc/logrotate.d/panorama-client
```

```text
/var/log/nginx/panorama-client.log {
    hourly
    rotate 2
    missingok
    notifempty
    copytruncate
}
```

Если `logrotate` на сервере запускается только раз в день, добавьте почасовой запуск:

```bash
(crontab -l 2>/dev/null; echo "0 * * * * /usr/sbin/logrotate /etc/logrotate.d/panorama-client") | crontab -
```

```bash
ln -sf /etc/nginx/sites-available/panorama /etc/nginx/sites-enabled/panorama

rm -f /etc/nginx/sites-enabled/default

nginx -t

systemctl restart nginx
```

---

## Настройка DNS

Добавить A-записи:

```text
panorama-agency.ru
www.panorama-agency.ru
```

↓

```text
IP сервера
```

---

## Выпуск SSL-сертификата

```bash
certbot --nginx -d panorama-agency.ru -d www.panorama-agency.ru
```

### Если Certbot не смог установить сертификат

```bash
nano /etc/letsencrypt/options-ssl-nginx.conf
```

Заменить

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
```

на

```nginx
ssl_protocols TLSv1.2;
```

Проверить, что в файле сайта `/etc/nginx/sites-available/panorama` отсутствуют строки:

```nginx
ssl_protocols ...
```

После этого выполнить:

```bash
nginx -t

systemctl reload nginx

certbot install --cert-name panorama-agency.ru
```

---

## Проверка

```bash
curl -I https://panorama-agency.ru

curl -I --tlsv1.2 https://panorama-agency.ru

curl -I --tlsv1.3 https://panorama-agency.ru
```

Ожидаемый результат:

- TLS 1.2 → `200 OK`
- TLS 1.3 → ошибка (если TLS 1.3 отключён)

---

## Обновление проекта

### Через Git

```bash
cd /var/www/panorama-site/panorama-site

git pull

npm install

npm run build

systemctl reload nginx
```
