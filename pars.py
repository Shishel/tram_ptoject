from flask import Flask, jsonify
from flask_cors import CORS

import requests
from threading import Thread
import time

app = Flask(__name__)
CORS(app)

# Глобальная переменная для хранения данных
tram_data = []

# Функция для корректировки координат
def correct_coordinates(coord):
    """
    Исправляет формат координаты, добавляя точку после первых двух цифр.
    """
    coord = coord.strip()  # Убираем пробелы
    if len(coord) > 2:
        return float(coord[:2] + '.' + coord[2:])
    else:
        raise ValueError(f"Некорректная координата: {coord}")

# Функция парсинга файла
def fetch_data():
    global tram_data
    url = "https://proezd.kttu.ru/krasnodar/gps.txt"
    while True:
        try:
            # Получаем файл с сервера
            response = requests.get(url)
            lines = response.text.strip().split('\n')  # Разбиваем файл построчно
            
            # Преобразуем данные в структуру
            tram_data = []
            for line in lines:
                parts = line.split(',')
                if len(parts) >= 3:
                    try:
                        # Применяем корректировку к координатам
                        lat = correct_coordinates(parts[3])
                        lon = correct_coordinates(parts[2])
                        tram_data.append({
                            "type": parts[0].strip(),
                            "route": parts[1].strip(),
                            "speed": parts[4].strip(),
                            "lat": lat,
                            "lon": lon
                        })
                    except ValueError as e:
                        print(f"Некорректная строка: {line} ({e})")
            print("Данные обновлены:", tram_data)  # Лог обновления
        except Exception as e:
            print("Ошибка при получении данных:", e)
        
        time.sleep(10)  # Запрашиваем данные каждые 10 секунд

# API для предоставления данных
@app.route('/api/trams')
def get_trams():
    return jsonify(tram_data)

# Функция для запуска Flask в отдельном потоке
def run_flask():
    app.run(debug=True, use_reloader=False)

if __name__ == "__main__":
    # Запускаем Flask в одном потоке
    flask_thread = Thread(target=run_flask)
    flask_thread.start()

    # Запускаем функцию парсинга данных в основном потоке
    fetch_data()