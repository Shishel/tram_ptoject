let map;
let placemarks = []; // Массив для хранения всех меток

// Функция для получения имени папки на основе типа транспорта
function getFolderNameByType(type) {
    switch (type) {
        case "1":
            return "trol"; // Троллейбус
        case "2":
            return "bus"; // Автобус
        case "3":
            return "tram"; // Трамвай
        case "4":
            return "service"; // Сервис
        default:
            return "default"; // Если тип неизвестен
    }
}

// Функция для обновления меток
function updateTrams() {
    fetch('/api/trams')
        .then(response => response.json())
        .then(data => {
            // Удаляем старые метки
            placemarks.forEach(placemark => {
                map.geoObjects.remove(placemark);
            });
            placemarks = []; // Очищаем массив меток

            data.forEach(item => {
                const coordinates = [item.lat, item.lon];
                const type = item.type; // Тип транспорта
                const route = item.route; // Номер маршрута

                // Определяем путь к иконке
                const folderName = getFolderNameByType(type);
                const iconPath = `/static/images/${folderName}/${route}.png`;

                // Создаем метку с кастомной иконкой
                const placemark = new ymaps.Placemark(coordinates, {
                    balloonContent: `Маршрут: ${route}<br>Тип: ${folderName}` // Информация в балуне
                }, {
                    iconLayout: 'default#image',
                    iconImageHref: iconPath, // Путь к иконке
                    iconImageSize: [30, 30], // Размер иконки
                    iconImageOffset: [-15, -15] // Сдвиг иконки
                });

                // Добавляем метку на карту
                map.geoObjects.add(placemark);
                placemarks.push(placemark); // Сохраняем метку в массиве
            });
        })
        .catch(error => {
            console.error("Ошибка при получении данных с API:", error);
        });
}

// Инициализация карты
ymaps.ready(() => {
    map = new ymaps.Map("map", {
        center: [45.035470, 38.975313], // Центр карты (можно поменять)
        zoom: 12 // Уровень зума
    });

    updateTrams(); // Первоначальная загрузка меток
    setInterval(updateTrams, 5000); // Обновление каждые 5 секунд
});