let map;
let placemarks = [];
let routeType = 'auto'; // Переменная для маршрута
let currentRoute = null; // Переменная для текущего маршрута

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
    fetch('https://b82f-87-121-58-199.ngrok-free.app/api/trams')
        .then(response => response.json())
        .then(data => {
            placemarks.forEach(placemark => map.geoObjects.remove(placemark));
            placemarks = [];

            data.forEach(item => {
                const coordinates = [item.lat, item.lon];
                const type = item.type;
                const route = item.route;  // НЕ обновляем глобальный route здесь!
                const numberBort = item.numberBort;

                const folderName = getFolderNameByType(type);
                let iconPath = (route.length > 4) 
                    ? 'static/images/service/s.png'  
                    : `static/images/${folderName}/${route}.png`;

                    const placemark = new ymaps.Placemark(coordinates, {}, {
                        iconLayout: 'default#image',
                        iconImageHref: iconPath,
                        iconImageSize: [30, 30],
                        iconImageOffset: [-15, -15],
                        hasBalloon: false,  // Отключаем всплывающее окно
                        hasHint: false      // Отключаем хинт (подсказку)
                    });

                // Обработчик клика на метку
                placemark.events.add('click', function () {
                    globalThis.route = route;  // Обновляем переменную только при клике!
                    updateDetails(route, folderName, numberBort);
                    openInfoPanel(route, folderName, numberBort);
                });

                map.geoObjects.add(placemark);
                placemarks.push(placemark);
            });
        })
        .catch(error => console.error("Ошибка при получении данных с API:", error));
}

const tramCond = {
    "300-353": false,  // Кондиционер
    "500": false, // Нет кондиционера
    "508-595": false,  // Кондиционер
    "001-158": false, 
    "226-236": false,
    "237-245": false,
    "495": false,
    "246-266": false,
    "501-503": false,
    "165-199": true,
    "267-297": true,
    "355-393": true,
    "160-164": false,
    "201": true,
    "202-205": true,
    "600-619": true,
    "620-639": true
    // Добавьте другие диапазоны по необходимости
};

const tramFloor = {
    "300-353": false,  
    "500": false, 
    "508-595": false,  
    "001-158": false, 
    "226-236": false,
    "237-245": false,
    "495": false,
    "246-266": true,
    "501-503": true,
    "165-199": true,
    "267-297": true,
    "355-393": true,
    "160-164": true,
    "201": true,
    "202-205": true,
    "600-619": true,
    "620-639": true
}

const trolCond = {
    "058-138": false,
    "205": false,
    "207": false,
    "222-223": false,
    "288-299": false,
    "361": false,
    "396-397": false,
    "105": false,
    "140-149": false,
    "157-164": false,
    "227-240": false,
    "246-253": false,
    "002-003": false,
    "005": false, 
    "153-155": false, 
    "165-178": true,
    "241-245": true,
    "254-255": true,
    "257-259": true,
    "261-276": true,
    "006-017": true, 
    "179-188": true,
    "189-192": true, 
    "194-196": true,
    "277-284": true,
    "389": true, 
    "018-038": true,
    "303-319": true, 
    "400-421": true
}

const trolFloor = {
    "058-138": false,
    "205": false,
    "207": false,
    "222-223": false,
    "288-299": false,
    "361": false,
    "396-397": false,
    "105": false,
    "140-149": false,
    "157-164": false,
    "227-240": false,
    "246-253": false,
    "002-003": true,
    "005": true, 
    "153-155": true, 
    "165-178": true,
    "241-245": true,
    "254-255": true,
    "257-259": true,
    "261-276": true,
    "006-017": true, 
    "179-188": true,
    "189-192": true, 
    "194-196": true,
    "277-284": true,
    "389": true, 
    "018-038": true,
    "303-319": true, 
    "400-421": true
}

function isInRange(range, number) {
    const parts = range.split('-');
    if (parts.length === 2) {
        // Если это диапазон (например "300-353")
        const start = parseInt(parts[0], 10);
        const end = parseInt(parts[1], 10);
        return number >= start && number <= end;
    } else {
        // Если это одно число (например "500")
        return number === parseInt(range, 10);
    }
}

// Функция для получения состояния кондиционера по номеру борта
function getConditionerStatus(numberBort, type) {
    let data;
    
    if (type === 'tram') {
        data = tramCond;
    } else if (type === 'trol') {
        data = trolCond;
    }

    for (let range in data) {
        if (isInRange(range, numberBort)) {
            return data[range];
        }
    }
    return false; // Если номер борта не найден, возвращаем значение по умолчанию
}

// Функция для получения состояния низкого пола
function getFloorStatus(numberBort, type) {
    let data;
    
    if (type === 'tram') {
        data = tramFloor;
    } else if (type === 'trol') {
        data = trolFloor;
    }

    for (let range in data) {
        if (isInRange(range, numberBort)) {
            return data[range];
        }
    }
    return false; // Если номер борта не найден, возвращаем значение по умолчанию
}

function updateDetails(route, folderName, numberBort) {
    const detailsContainer = document.getElementById("details-container");
    let detailsHTML = '';

    const isCond = getConditionerStatus(numberBort, folderName);
    const isFloor = getFloorStatus(numberBort, folderName);

    if (folderName === 'tram') {
        detailsHTML = `
            <div class="detail-row">
                <img src="static/images/icons/${isFloor ? 'true' : 'false'}.svg" alt="галка 1" class="detail-icon">
                <span>Низкий пол</span>
            </div>
            <div class="detail-row">
                <img src="static/images/icons/${isCond ? 'true' : 'false'}.svg" alt="Описание 2" class="detail-icon">
                <span>Кондиционер</span>
            </div>
            <div class="detail-row">
                <img src="static/images/icons/false.svg" alt="false" class="detail-icon">
                <span>Wi-Fi</span>
            </div>
            <div class="detail-row">
                <img src="static/images/icons/tram_icon.svg" alt="Описание 4" class="detail-icon">
                <span>Трамвай</span>
            </div>
        `;
    } else if (folderName === 'trol') {
        detailsHTML = `
            <div class="detail-row">
                <img src="static/images/icons/${isFloor ? 'true' : 'false'}.svg" alt="галка 1" class="detail-icon">
                <span>Низкий пол</span>
            </div>
            <div class="detail-row">
                <img src="static/images/icons/${isCond ? 'true' : 'false'}.svg" alt="Описание 2" class="detail-icon">
                <span>Кондиционер</span>
            </div>
            <div class="detail-row">
                <img src="static/images/icons/false.svg" alt="false" class="detail-icon">
                <span>Wi-Fi</span>
            </div>
            <div class="detail-row">
                <img src="static/images/icons/trol_icon.svg" alt="Описание 4" class="detail-icon">
                <span>Тролейбус</span>
            </div>
        `;
    } else if (folderName === 'bus') {
        detailsHTML = `
            <div class="detail-row">
                <img src="static/images/icons/true.svg" alt="галка 1" class="detail-icon">
                <span>Низкий пол</span>
            </div>
            <div class="detail-row">
                <img src="static/images/icons/false.svg" alt="Описание 2" class="detail-icon">
                <span>Кондиционер</span>
            </div>
            <div class="detail-row">
                <img src="static/images/icons/false.svg" alt="false" class="detail-icon">
                <span>Wi-Fi</span>
            </div>
            <div class="detail-row">
                <img src="static/images/icons/bus_icon.svg" alt="Описание 4" class="detail-icon">
                <span>Автобус</span>
            </div>
        `;

    }

    detailsContainer.innerHTML = detailsHTML; // Устанавливаем новое содержимое
}

// Функция для обновления содержимого меню


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
                transportData.innerHTML = `<b>Номер борта:</b> ${tram['bort of number']}<br><b>Маршрут:</b> ${tram.route}`;
                routeInfo.innerHTML = `<b>Маршрут:</b> ${tram.route}`;
                typeInfo.innerHTML = `<b>Тип:</b> ${tram.type}`;
                bortNumberInfo.innerHTML = `<b>Номер борта:</b> ${tram['bort of number']}`;           
            } else {
                console.log("Нет данных");

                

                

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





function openInfoPanel(route, folderName, numberBort) {
    const transportData = document.getElementById('transport-data'); 
    const transportBox = document.querySelector('.red-box');
    const icon = document.getElementById('type-image');
    const routeinf = document.getElementById('route-info')

    transportData.innerHTML = `<b>#</b> ${numberBort}<br>`;

    transportBox.className = 'red-box';
    


    switch (folderName) {
        case 'bus':
            transportBox.style.backgroundColor = '#00BE00';
            icon.src = '/static/images/icons/bus_icon.svg';
            routeinf.innerHTML = `<span>${route}</span>`
            break;
        case 'tram':
            transportBox.style.backgroundColor = '#CE0000';
            icon.src = '/static/images/icons/tram_icon.svg';
            routeinf.innerHTML = `<span>${route}</span>`
            break;
        case 'trol':
            transportBox.style.backgroundColor = '#0073AC';
            icon.src = '/static/images/icons/trol_icon.svg';
            routeinf.innerHTML = `<span>${route}</span>`
            break;
        default:
            transportBox.style.backgroundColor = 'grey'; 
    }

    
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
    
    // Инициализируем карту
    map = new ymaps.Map("map", {
        center: [45.035470, 38.975313],  // Центр карты (Краснодар)
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
    const saveButton = document.getElementById('flip-btn');

    // Обработчик клика для отображения панели при клике на search-container
    button.addEventListener('click', function(event) {
        if (!routePanel.contains(event.target)) {
            routePanel.style.display = (routePanel.style.display === 'none' || routePanel.style.display === '') 
                ? 'block' 
                : 'none';
        }
    });

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

    exitButton.addEventListener('click', function() {
        const input1 = document.getElementById('input1').value;
        const input2 = document.getElementById('input2').value;
        routePanel.style.display = 'none';
        
    });

    exitButton2.addEventListener('click', function() {
        infopanel.style.display = 'none'
    })

});
