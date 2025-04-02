let map;
let placemarks = [];

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
                    ? 'images/service/s.png'  
                    : `images/${folderName}/${route}.png`;

                const placemark = new ymaps.Placemark(coordinates, {
                    balloonContent: `Маршрут: ${route}<br>Тип: ${folderName}`
                }, {
                    iconLayout: 'default#image',
                    iconImageHref: iconPath,
                    iconImageSize: [30, 30],
                    iconImageOffset: [-15, -15]
                });

                // Добавляем обработчик клика на метку
                placemark.events.add('click', function () {
                    updateDetails(route, folderName);  // Обновление данных в меню
                });

                map.geoObjects.add(placemark);
                placemarks.push(placemark);
            });
        })
        .catch(error => console.error("Ошибка при получении данных с API:", error));
}


// Функция для обновления содержимого меню
function updateDetails(route, folderName) {
    const detailsContainer = document.getElementById("details-container");
    let detailsHTML = '';

    if (folderName === 'tram') {
        detailsHTML = `
            <div class="detail-row">
                  <img src="images/icons/true.svg" alt="галка 1" class="detail-icon">
                  <span>Низкий пол</span>
                </div>
                <div class="detail-row">
                  <img src="images/icons/true.svg" alt="Описание 2" class="detail-icon">
                  <span>Кондиционер</span>
                </div>
                <div class="detail-row">
                  <img src="images/icons/false.svg" alt="false" class="detail-icon">
                  <span>Wi-Fi</span>
                </div>
                <div class="detail-row">
                  <img src="images/icons/tram_icon.svg" alt="Описание 4" class="detail-icon">
                  <span>Трамвай</span>
                </div>
        `;
    } else if (folderName === 'bus') {
        detailsHTML = `
            <div class="detail-row">
                  <img src="images/icons/false.svg" alt="галка 1" class="detail-icon">
                  <span>Низкий пол</span>
                </div>
                <div class="detail-row">
                  <img src="images/icons/false.svg" alt="Описание 2" class="detail-icon">
                  <span>Кондиционер</span>
                </div>
                <div class="detail-row">
                  <img src="images/icons/false.svg" alt="false" class="detail-icon">
                  <span>Wi-Fi</span>
                </div>
                <div class="detail-row">
                  <img src="images/icons/bus_icon.svg" alt="Описание 4" class="detail-icon">
                  <span>Автобус</span>
                </div>
        `;
    } else if (folderName === 'trol') {
        detailsHTML = `
            <div class="detail-row">
                  <img src="images/icons/true.svg" alt="галка 1" class="detail-icon">
                  <span>Низкий пол</span>
                </div>
                <div class="detail-row">
                  <img src="images/icons/true.svg" alt="Описание 2" class="detail-icon">
                  <span>Кондиционер</span>
                </div>
                <div class="detail-row">
                  <img src="images/icons/false.svg" alt="false" class="detail-icon">
                  <span>Wi-Fi</span>
                </div>
                <div class="detail-row">
                  <img src="images/icons/trol_icon.svg" alt="Описание 4" class="detail-icon">
                  <span>ss</span>
                </div>
        `;
    } 

    detailsContainer.innerHTML = detailsHTML; // Устанавливаем новое содержимое
}

function updateTransportData() {
    fetch('/api/trams')
        .then(response => response.json())
        .then(data => {
            const routeInfo = document.getElementById('route-info');
            const typeInfo = document.getElementById('type-info');
            const typeImage = document.getElementById('type-image');
            const bortNumberInfo = document.getElementById('transport-data');

            
            if (data.length > 0) {
                const tram = data[0]; 
                const transportData = document.getElementById('transport-data');
                transportData.innerHTML = `<b>Номер борта:</b> ${tram['bort of number']}<br><b>Маршрут:</b> ${tram.route}`;            } else {
                console.log("Нет данных");

                

                routeInfo.innerHTML = `<b>Маршрут:</b> ${tram.route}`;
                typeInfo.innerHTML = `<b>Тип:</b> ${tram.type}`;
                bortNumberInfo.innerHTML = `<b>Номер борта:</b> ${tram['bort of number']}`;

                switch (tram.type) {
                    case 'tram':
                        typeImage.src = 'images/icons/auto_icon.svg';
                        break;
                    case 'bus':
                        typeImage.src = 'images/icons/bus_icon.svg';
                        break;
                    case 'trol':
                        typeImage.src = 'images/icons/trol_icon.svg';
                        break;
                    default:
                        typeImage.src = ''; 
            }
        }
    })
}

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
                    iconImageHref: 'images/icons/me.svg', // Путь к вашей иконке
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

function openInfoPanel(route, folderName) {
    const transportData = document.getElementById('transport-data'); 
    const transportBox = document.querySelector('.red-box');

    transportData.innerHTML = `<b>Маршрут:</b> ${route}<br><b>Тип транспорта:</b> ${folderName}`;

    transportBox.className = 'red-box'; 

    switch (folderName) {
        case 'bus':
            transportBox.style.backgroundColor = 'green';
            break;
        case 'tram':
            transportBox.style.backgroundColor = 'red';
            break;
        case 'trol':
            transportBox.style.backgroundColor = 'blue';
            break;
        default:
            transportBox.style.backgroundColor = 'grey'; 
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
    const infopanel = document.getElementById('infoPanel')
    const exitButton2 = document.getElementById('exit2');

    // Обработчик клика для отображения панели при клике на search-container
    button.addEventListener('click', function(event) {
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

    exitButton2.addEventListener('click', function() {
        infopanel.style.display = 'none'
    })
});