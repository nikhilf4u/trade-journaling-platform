#!/bin/bash

PROJECT_DIR="$HOME/IdeaProjects/trading-journal-platform"
JWT_SECRET="6E9C5F7B3A8D1E2F4C7A9B3D5E8F2C4A6B7D9E1F3C5A7B9D1E3F5A7C9B1D3E5F"

case "$1" in
  user)
    cd "$PROJECT_DIR/user-service"
    SPRING_PROFILES_ACTIVE=dev \
    DATABASE_URL=jdbc:postgresql://localhost:5432/userdb \
    DATABASE_USERNAME=trader \
    DATABASE_PASSWORD=trader123 \
    JWT_SECRET="$JWT_SECRET" \
    mvn spring-boot:run
    ;;

  trade)
    cd "$PROJECT_DIR/trade-service"
    SPRING_PROFILES_ACTIVE=dev \
    DATABASE_URL=jdbc:postgresql://localhost:5433/tradedb \
    DATABASE_USERNAME=trader \
    DATABASE_PASSWORD=trader123 \
    SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
    JWT_SECRET="$JWT_SECRET" \
    UPLOAD_DIR=./uploads \
    mvn spring-boot:run
    ;;

  analytics)
    cd "$PROJECT_DIR/analytics-service"
    SPRING_PROFILES_ACTIVE=dev \
    DATABASE_URL=jdbc:postgresql://localhost:5433/tradedb \
    DATABASE_USERNAME=trader \
    DATABASE_PASSWORD=trader123 \
    SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
    SPRING_DATA_REDIS_HOST=localhost \
    SPRING_DATA_REDIS_PORT=6379 \
    JWT_SECRET="$JWT_SECRET" \
    mvn spring-boot:run
    ;;

  gateway)
    cd "$PROJECT_DIR/api-gateway"
    SPRING_PROFILES_ACTIVE=dev \
    USER_SERVICE_URL=http://localhost:8081 \
    TRADE_SERVICE_URL=http://localhost:8082 \
    ANALYTICS_SERVICE_URL=http://localhost:8083 \
    JWT_SECRET="$JWT_SECRET" \
    mvn spring-boot:run
    ;;

  frontend)
    cd "$PROJECT_DIR/frontend"
    npm run dev
    ;;

  *)
    echo "Usage: ./scripts/dev.sh {user|trade|analytics|gateway|frontend}"
    exit 1
    ;;
esac