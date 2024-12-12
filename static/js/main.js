let map;
let placemarks = [];
let multiRoute;

// Функция для получения имени папки на основе типа транспорта
function getFolderNameByType(type) {
    switch (type) {
        case "1": return "trol";  
        case "2": return "bus";   
        case "3": return "tram";  
        case "4": return "service"; 
        default: return "default"; 
    }
}

// Функция для обновления меток транспорта
function updateTrams() {
    fetch('/api/trams')
        .then(response => response.json())
        .then(data => {
            placemarks.forEach(placemark => map.geoObjects.remove(placemark));
            placemarks = [];

            data.forEach(item => {
                const coordinates = [item.lat, item.lon];
                const type = item.type;
                const route = item.route;

                const folderName = getFolderNameByType(type);
                const iconPath = `/static/images/${folderName}/${route}.png`;

                const placemark = new ymaps.Placemark(coordinates, {
                    balloonContent: `Маршрут: ${route}<br>Тип: ${folderName}`
                }, {
                    iconLayout: 'default#image',
                    iconImageHref: iconPath,
                    iconImageSize: [30, 30],
                    iconImageOffset: [-15, -15]
                });

                map.geoObjects.add(placemark);
                placemarks.push(placemark);
            });
        })
        .catch(error => console.error("Ошибка при получении данных с API:", error));
}

// Функция для отображения местоположения пользователя
function locateUser() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const userCoordinates = [position.coords.latitude, position.coords.longitude];
            const userPlacemark = new ymaps.Placemark(userCoordinates, {
                iconCaption: 'Вы здесь',
                balloonContent: '<b>Ваше местоположение</b>'
            }, {
                preset: 'islands#blueCircleIconWithCaption',
                iconCaptionMaxWidth: '200',
            });

            map.geoObjects.add(userPlacemark);
            map.setCenter(userCoordinates, 14);
        }, error => {
            alert("Не удалось определить местоположение.");
        });
    } else {
        alert("Ваш браузер не поддерживает Geolocation API.");
    }
}

// Функция для построения маршрута с использованием адресов
function buildRoute() {
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    if (!start || !end) return alert("Укажите начальную и конечную точки маршрута.");

    // Remove existing route if it exists
    if (multiRoute) {
        map.geoObjects.remove(multiRoute);
    }

    // Create new route
    multiRoute = new ymaps.multiRouter.MultiRoute({
        referencePoints: [start, end],
        params: {
            routingMode: "auto"
        }
    }, {
        boundsAutoApply: true
    });

    // Add new route to map
    map.geoObjects.add(multiRoute);
}

// Инициализация карты
ymaps.ready(() => {
    // Инициализируем карту
    map = new ymaps.Map("map", {
        center: [45.035470, 38.975313],  // Центр карты (Краснодар)
        zoom: 10
    });

    locateUser();  // Отображаем местоположение пользователя
    updateTrams();  // Обновляем метки транспорта
    setInterval(updateTrams, 10000);  // Обновляем метки каждую секунду

    new ymaps.SuggestView('start');  // Подсказки для начальной точки
    new ymaps.SuggestView('end');    // Подсказки для конечной точки

    // Обработчик для кнопки построения маршрута
    document.getElementById('buildRouteBtn').addEventListener('click', buildRoute);
});