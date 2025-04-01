let map;
let placemarks = [];

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
                let iconPath;
                if (route.length > 4) {
                    iconPath = `/static/images/service/s.png`; // Альтернативный путь
                } else {
                    iconPath = `/static/images/${folderName}/${route}.png`; // Оригинальный путь
                }
                

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
// Функция для получения местоположения пользователя и добавления метки на карту
function getUserLocationAndAddMarker(map) {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const userCoordinates = [position.coords.latitude, position.coords.longitude];

                // Создаем и добавляем метку на карту
                const userPlacemark = new ymaps.Placemark(userCoordinates, {
                    iconCaption: 'Вы здесь',
                    balloonContent: '<b>Ваше местоположение</b>'
                }, {
                    iconLayout: 'default#image',
                    iconImageHref: '/static/images/icons/me.svg', // Путь к вашей иконке
                    iconImageSize: [40, 40], // Размер иконки
                    iconImageOffset: [-20, -20] // Сдвиг иконки (чтобы центр совпадал с местоположением)
                });

                map.geoObjects.add(userPlacemark);
                map.setCenter(userCoordinates, 14);

                resolve(userCoordinates);  // Возвращаем координаты
            }, reject);
        } else {
            reject("Geolocation не поддерживается браузером");
        }
    });
}

// Функция для подстановки местоположения в поле маршрута, если оно пустое
function setFromLocationIfEmpty(routePanelControl, userCoordinates) {
    const fromPoint = routePanelControl.routePanel.state.get('from');
    if (!fromPoint || fromPoint === "") {
        routePanelControl.routePanel.state.set({
            from: userCoordinates
        });
    }
}


// Инициализация карты
ymaps.ready(() => {
    // Инициализируем карту
    map = new ymaps.Map("map", {
        center: [45.035470, 38.975313],  // Центр карты (Краснодар)
        zoom: 10
    });

    // Обработчик для кнопки увеличения масштаба
    document.getElementById('zoomIn').addEventListener('click', () => {
        let currentZoom = map.getZoom();
        map.setZoom(currentZoom + 1);  // Увеличиваем масштаб на 1
    });

    // Обработчик для кнопки уменьшения масштаба
    document.getElementById('zoomOut').addEventListener('click', () => {
        let currentZoom = map.getZoom();
        map.setZoom(currentZoom - 1);  // Уменьшаем масштаб на 1
    });

    updateTrams();  // Обновляем метки транспорта
    setInterval(updateTrams, 10000);  // Обновляем метки каждые 10 секунд

    const button = document.getElementById('search-container');
    const routePanel = document.getElementById('routepanel');
    const exitButton = document.getElementById('exit');

    // Обработчик клика для отображения панели при клике на search-container
    button.addEventListener('click', function(event) {
        // Проверка, чтобы клики внутри панели не закрывали её
        if (!routePanel.contains(event.target)) {
            routePanel.style.display = (routePanel.style.display === 'none' || routePanel.style.display === '') 
                ? 'block' 
                : 'none';
        }
    });
    exitButton.addEventListener('click', function() {
        const input1 = document.getElementById('input1').value;
        const input2 = document.getElementById('input2').value;
        routePanel.style.display = 'none';
    });
});