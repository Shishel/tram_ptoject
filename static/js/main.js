let map;
let placemarks = [];
let routeType = 'auto'; // Переменная для маршрута
let currentRoute = null; // Переменная для текущего маршрута

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

function updateRouteType(type) {
    routeType = type;
    console.log('Тип маршрута изменен на:', routeType);
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
                let iconPath = (route.length > 4) 
                    ? `/static/images/service/s.png`  
                    : `/static/images/${folderName}/${route}.png`;

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

// Функция для получения местоположения пользователя
function getUserLocationAndAddMarker(map) {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const userCoordinates = [position.coords.latitude, position.coords.longitude];

                const userPlacemark = new ymaps.Placemark(userCoordinates, {
                    iconCaption: 'Вы здесь',
                    balloonContent: '<b>Ваше местоположение</b>'
                }, {
                    iconLayout: 'default#image',
                    iconImageHref: '/static/images/icons/me.svg',
                    iconImageSize: [40, 40],
                    iconImageOffset: [-20, -20]
                });

                map.geoObjects.add(userPlacemark);
                map.setCenter(userCoordinates, 14);

                resolve(userCoordinates);
            }, reject);
        } else {
            reject("Geolocation не поддерживается браузером");
        }
    });
}

// Инициализация карты
ymaps.ready(() => {

    if (ymaps.SuggestView) {
        const suggest1 = new ymaps.SuggestView('input1');
        const suggest2 = new ymaps.SuggestView('input2');

        suggest1.events.add('select', function (e) {
            const selectedValue = e.get('item').value.trim();
            document.getElementById('input1').value = selectedValue;
        });

        suggest2.events.add('select', function (e) {
            const selectedValue = e.get('item').value.trim();
            document.getElementById('input2').value = selectedValue;
        });
    }

    map = new ymaps.Map("map", {
        center: [45.035470, 38.975313],  
        zoom: 10
    });

    map.controls.remove('zoomControl'); // Убираем кнопки зума
    map.controls.remove('searchControl'); // Убираем строку поиска
    map.controls.remove('typeSelector'); // Убираем панель типов карты
    map.controls.remove('geolocationControl'); // Убираем кнопку геолокации
    map.controls.remove('routePanelControl'); // Убираем панель маршрута
    map.controls.remove('trafficControl'); // Убираем кнопку трафика
    map.controls.remove('rulerControl');

    document.getElementById('btn1').addEventListener('click', () => {
        updateRouteType('auto');
    });

    // Обработчик для кнопки "Общественный транспорт"
    document.getElementById('btn2').addEventListener('click', () => {
        updateRouteType('masstransit');
    });

    // Обработчик для кнопки "Пешком"
    document.getElementById('btn3').addEventListener('click', () => {
        updateRouteType('pedestrian');
    });

    document.getElementById('zoomIn').addEventListener('click', () => {
        map.setZoom(map.getZoom() + 1);
    });

    document.getElementById('zoomOut').addEventListener('click', () => {
        map.setZoom(map.getZoom() - 1);
    });

    updateTrams();
    setInterval(updateTrams, 10000);

    const button = document.getElementById('search-container');
    const routePanel = document.getElementById('routepanel');
    const saveButton = document.getElementById('flip-btn');

    button.addEventListener('click', (event) => {
        if (!routePanel.contains(event.target)) {
            routePanel.style.display = (routePanel.style.display === 'none' || routePanel.style.display === '') 
                ? 'block' 
                : 'none';
        }
    });

    // Обработчик клика по кнопке "Сохранить"
    saveButton.addEventListener('click', function(event) {
        let input1 = document.getElementById('input1').value.trim();
        let input2 = document.getElementById('input2').value.trim();

        if (!input1.toLowerCase().includes("краснодар")) input1 = "Краснодар, " + input1;
        if (!input2.toLowerCase().includes("краснодар")) input2 = "Краснодар, " + input2;

        console.log("Маршрут:", input1, "→", input2);

        // Удаляем только старый маршрут, если он существует
        if (currentRoute) {
            map.geoObjects.remove(currentRoute);
        }

        // Строим новый маршрут с учетом выбранного типа
        const multiRoute = new ymaps.multiRouter.MultiRoute({ 
            referencePoints: [input1, input2], 
            params: { routingMode: routeType } 
        });

        // Сохраняем новый маршрут в переменной
        currentRoute = multiRoute;

        map.geoObjects.add(multiRoute);
    });




});