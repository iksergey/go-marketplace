# Go Marketplace

## ➡️ [Полное описание курса](https://iksergey.github.io/go-marketplace/) + [промокод](https://stepik.org/a/266408/pay?promo=dd9370c9066886a3&utm_source=github&utm_medium=readme&utm_campaign=stepik-go-course)

Marketplace-проект на Go из финальной части `Go Master Course`. Репозиторий отражает этап курса, где приложение собирается в виде e-commerce платформы из нескольких сервисов с синхронным и асинхронным взаимодействием.

## Что внутри

Проект собран вокруг 4 сервисов:

- `catalog` — каталог товаров на `PostgreSQL`
- `basket` — корзина на `PostgreSQL` с кешем в `Redis`
- `promotion` — сервис скидок на `gRPC` с `MySQL`
- `checkout` — оформление заказа на `PostgreSQL`

Коммуникации и инфраструктура:

- `gRPC` для синхронного запроса скидок из `basket` в `promotion`
- `RabbitMQ` для асинхронного обмена событиями между сервисами
- `Prometheus` и `Grafana` для метрик и мониторинга
- `k6` для нагрузочных сценариев
- `Portainer` для управления контейнерами
- `Docker Compose` для dev/prod окружений

## Какой материал курса отражён в проекте

Курс ведёт от базового Go к production-style микросервисам и покрывает:

- основы Go, структуры, интерфейсы, конкурентность
- SOLID и базовые паттерны проектирования
- REST API и авторизацию
- микросервисную архитектуру
- `gRPC`, `RabbitMQ`, `PostgreSQL`, `MySQL`, `Redis`
- observability через `Prometheus` и `Grafana`

В полном курсе заявлены:

- `300+` видеоуроков
- `50+` часов видео
- `261` тест
- `45` интерактивных задач
- `3` проекта

Этот репозиторий соответствует финальному проекту курса: marketplace-платформе из нескольких сервисов.

## Структура репозитория

```text
.
├── cmd/
│   ├── basket/
│   ├── catalog/
│   ├── checkout/
│   └── promotion/
├── migrations/
│   ├── basket/
│   ├── catalog/
│   ├── checkout/
│   └── promotion/
├── infrastructure/
│   ├── grafana/
│   ├── k6/
│   ├── prometheus/
│   └── portainer_password.txt
├── compose-dev.yaml
├── compose-prod.yaml
└── preview/index.html
```

## Быстрый старт

### Dev-инфраструктура

Поднимает базы данных, Redis и RabbitMQ для локальной разработки:

```bash
docker compose -p marketplace-dev -f compose-dev.yaml up -d
```

Остановить и удалить тома:

```bash
docker compose -p marketplace-dev -f compose-dev.yaml down -v
```

### Prod-like запуск

Поднимает сервисы приложения и инфраструктуру мониторинга:

```bash
docker compose -p marketplace-prod -f compose-prod.yaml up --build -d
```

Остановить окружение:

```bash
docker compose -p marketplace-prod -f compose-prod.yaml down -v
```

## Переменные окружения

Базовые локальные настройки вынесены в [.env.example](/Users/i/Desktop/-marketplace-go/.env.example). В нём описаны:

- порты и подключение `catalog` к `PostgreSQL`
- `basket` database URL, `Redis`, `RabbitMQ` и `gRPC`-адрес promotion-сервиса
- `promotion` database URL, путь к миграциям и порты `gRPC`/metrics
- `checkout` database URL, путь к миграциям и настройки `RabbitMQ`

## Compose-профили

[compose-dev.yaml](/Users/i/Desktop/-marketplace-go/compose-dev.yaml) содержит локальную инфраструктуру:

- `PostgreSQL` для `catalog`, `basket`, `checkout`
- `MySQL` для `promotion`
- `Redis`
- `RabbitMQ`

[compose-prod.yaml](/Users/i/Desktop/-marketplace-go/compose-prod.yaml) добавляет:

- сервисы `catalog_api`, `basket_api`, `promotion-grpc`, `checkout_api`
- `Prometheus`
- `Grafana`
- `k6`
- `Portainer`

## Миграции и observability

- SQL-миграции лежат в [migrations](/Users/i/Desktop/-marketplace-go/migrations)
- конфиг Prometheus лежит в [infrastructure/prometheus/prometheus.yml](/Users/i/Desktop/-marketplace-go/infrastructure/prometheus/prometheus.yml)
- provisioning Grafana лежит в [infrastructure/grafana/provisioning](/Users/i/Desktop/-marketplace-go/infrastructure/grafana/provisioning)
- сценарии нагрузочного тестирования лежат в [infrastructure/k6](/Users/i/Desktop/-marketplace-go/infrastructure/k6)

## Технологии

Основной стек по `go.mod` и compose-конфигам:

- `Go 1.25`
- `gin`
- `gRPC`
- `RabbitMQ`
- `PostgreSQL`
- `MySQL`
- `Redis`
- `Prometheus`
- `Grafana`
- `Docker Compose`

