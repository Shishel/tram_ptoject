from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS  # Для разрешения CORS
import requests
from threading import Thread
import time
import os

app = Flask(__name__, static_folder='static')

# Разрешаем CORS для всех маршрутов, связанных с API
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Глобальная переменная для хранения данных
tram_data = []

# Функция для корректировки координат
def correct_coordinates(coord):
    coord = coord.strip()
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
            response = requests.get(url)
            lines = response.text.strip().split('\n')  # Разбиваем файл построчно
            
            tram_data = []  # Сбрасываем старые данные
            for line in lines:
                parts = line.split(',')
                if len(parts) >= 3:
                    try:
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

# Роут для отдачи статичных файлов
@app.route('/')
def index():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'index.html')

# Функция для запуска Flask
def run_flask():
    app.run(debug=True, use_reloader=False)

if __name__ == "__main__":
    flask_thread = Thread(target=run_flask)
    flask_thread.start()
    fetch_data()