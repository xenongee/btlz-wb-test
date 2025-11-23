# Тестовое задание: сервис получения тарифов Wildberries и экспорта в Google Sheets

## Настройка

### 1. Клонирование и установка зависимостей
```bash
git clone <repository-url>
cd btlz-wb-test
npm install -y
```

### 2. Настройка переменных окружения
Скопируйте `example.env` в `.env`:

```bash
cp example.env .env
```

И заполните следующие переменные:
- `WB_TOKEN`: Токен Wildberries API
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Email сервисного аккаунта Google
- `GOOGLE_PRIVATE_KEY`: Приватный ключ сервисного аккаунта
- `GOOGLE_SPREADSHEET_ID`: ID'шники Google Sheets документов для экспорта


## Запуск

Полный запуск сервиса:

```bash
docker compose up --build
```

Запуск только базы данных:

```bash
docker compose up -d --build postgres
```

## Работа с базой данных

Выполнение миграций:

```bash
npm run knex:dev migrate latest
```


## Проверка работы

Логи приложения:

```bash
docker compose logs -f app
```

Проверка данных в БД:

```bash
docker compose exec postgres psql -U postgres -d postgres -c "SELECT COUNT(*) FROM tariffs;"
```

## Архитектура
- **WBService**: Получение данных из API Wildberries
- **GoogleSheetsService**: Экспорт данных в Google Sheets
- **TariffBoxService**: Работа с БД и координация экспорта
- **node-cron**: Cron-задача для ежечасного получения данных
