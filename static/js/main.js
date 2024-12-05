let map;
let placemarks = [];
let route;

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

// Функция для обновления меток
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

// Функция для получения координат через геокодер Яндекс по URL
// Функция для получения координат через геокодер Яндекс по URL
function getCoordinates(address) {
    const apiKey = '0f0cb27e-11ce-400f-af08-b552d5546e3c'; // Замените на ваш ключ API
    const geocodeUrl = 'https://geocode-maps.yandex.ru/1.x/';
    const url = `${geocodeUrl}?geocode=${encodeURIComponent(address)}&format=json&apikey=${apiKey}`;
    
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            const geoObject = data.response.GeoObjectCollection.featureMember[0]?.GeoObject;
            if (!geoObject) throw new Error("Адрес не найден");

            const coords = geoObject.Point.pos.split(' '); // Получаем координаты
            const latLon = [parseFloat(coords[1]), parseFloat(coords[0])]; // Возвращаем их как массив [lat, lon]
            console.log(`Координаты для ${address}: `, latLon); // Логирование координат
            return latLon;
        })
        .catch(error => {
            alert(error.message || "Ошибка при геокодировании");
            throw error;
        });
}

// Функция для построения мультимаршрута
function buildMultiRoute() {
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;
    const waypoints = document.getElementById('waypoints').value;  // Дополнительные точки, если они есть

    if (!start || !end) return alert("Укажите начальную и конечную точки маршрута.");

    // Разделяем точки на массив, если указаны дополнительные пути
    const waypointsArr = waypoints ? waypoints.split(',').map(point => point.trim()) : [];

    // Получаем координаты для начальной и конечной точки и дополнительных точек
    Promise.all([getCoordinates(start), getCoordinates(end), ...waypointsArr.map(getCoordinates)])
        .then(coords => {
            console.log('Координаты для маршрута:', coords); // Логирование всех координат

            const multiRoute = new ymaps.multiRouter.MultiRoute({
                referencePoints: [coords[0], ...coords.slice(1)],  // Создаем маршрут с начальной, дополнительными и конечной точками
                params: {
                    routingMode: 'masstransit'
                }
            }, {
                boundsAutoApply: true
            });

            // Удаляем старый маршрут, если он есть
            if (route) map.geoObjects.remove(route);

            // Добавляем новый маршрут на карту
            map.geoObjects.add(multiRoute);
            map.setBounds(multiRoute.getBounds());  // Обрезаем карту по границам маршрута
        })
        .catch(error => alert("Не удалось найти одну из точек маршрута."));
}

// Инициализация карты
ymaps.ready(() => {
    map = new ymaps.Map("map", {
        center: [45.035470, 38.975313],
        zoom: 12
    });

    locateUser();
    updateTrams();
    setInterval(updateTrams, 5000);

    new ymaps.SuggestView('start', { boundedBy: [[44, 37], [46, 40]] });
    new ymaps.SuggestView('end', { boundedBy: [[44, 37], [46, 40]] });
    
    // Вызываем функцию для построения мультимаршрута
    document.getElementById('buildRouteBtn').addEventListener('click', buildMultiRoute);
});