from flask import Flask, jsonify, send_from_directory
import threading
import requests
import time
import os

app = Flask(__name__, static_folder='static')

# Глобальная переменная для данных
tram_data = []

# Функция парсинга данных
def fetch_data():
    """
    Постоянно запрашивает данные с удалённого сервера и обновляет глобальную переменную tram_data.
    """
    global tram_data
    url = "https://proezd.kttu.ru/krasnodar/gps.txt"
    while True:
        try:
            print("Начало запроса данных...")
            response = requests.get(url, timeout=5)  # Устанавливаем таймаут для запроса
            response.raise_for_status()
            lines = response.text.strip().split('\n')

            updated_data = []
            for line in lines:
                parts = line.split(',')
                if len(parts) >= 5:
                    try:
                        lat = float(parts[3][:2] + '.' + parts[3][2:])
                        lon = float(parts[2][:2] + '.' + parts[2][2:])
                        updated_data.append({
                            "type": parts[0].strip(),
                            "route": parts[1].strip(),
                            "speed": parts[4].strip(),
                            "lat": lat,
                            "lon": lon
                        })
                    except ValueError as e:
                        print(f"Ошибка преобразования данных: {e}")
            tram_data = updated_data
            print("Данные успешно обновлены!")
        except requests.RequestException as e:
            print(f"Ошибка при запросе данных: {e}")
        except Exception as e:
            print(f"Неизвестная ошибка: {e}")

        # Парсер обновляет данные каждые 10 секунд
        time.sleep(10)

# API для данных
@app.route('/api/trams')
def get_trams():
    """
    Возвращает данные о транспорте.
    """
    return jsonify(tram_data)

# Отдача статического файла (карта)
@app.route('/')
def index():
    """
    Отдаёт файл index.html для отображения карты.
    """
    return send_from_directory(os.path.join(app.root_path, 'static'), 'index.html')

# Основной запуск
if __name__ == "__main__":
    # Поток для парсинга данных
    threading.Thread(target=fetch_data, daemon=True).start()
    print("Сервер запускается...")
    app.run(debug=True, use_reloader=False)