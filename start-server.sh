#!/bin/bash

# Запуск локального веб-сервера для тестування PWA Ганtt Про

echo ""
echo "========================================"
echo "  Локальний веб-сервер для Ганtt Про PWA"
echo "========================================"
echo ""

# Перевіримо Python
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "ПОМИЛКА: Python не встановлен"
        echo ""
        echo "Встановіть Python:"
        echo "  macOS:  brew install python3"
        echo "  Linux:  sudo apt-get install python3"
        echo ""
        exit 1
    fi
    PYTHON_CMD="python"
else
    PYTHON_CMD="python3"
fi

echo "✓ Python знайдений: $PYTHON_CMD"
echo ""
echo "Запуск сервера на http://localhost:8000"
echo "Натисніть Ctrl+C для зупинки"
echo ""

cd "$(dirname "$0")"

# Запуск HTTP сервера
$PYTHON_CMD -m http.server 8000

if [ $? -ne 0 ]; then
    echo "ПОМИЛКА: Не вдалося запустити сервер"
    exit 1
fi
