async function getAirQualityData(url) {
    const response = await fetch(url);
    const status = response.ok
    if (status) {
        return await response.json();
    }
    throw new Error('Data not valid');
}

const promises = [
    getAirQualityData('https://data.sensor.community/airrohr/v1/sensor/71550/'),
    getAirQualityData('https://data.sensor.community/airrohr/v1/sensor/71550/')
];

const p = Promise.all(promises);

class AirQualityData {
    constructor(dataSnapshots, location) {
        //@ts-ignore
        this.dataSnapshots = dataSnapshots;
        //@ts-ignore
        this.location = location;
    }

    location = {}
    dataSnapshots = []
}

class AirQualityDataLocation {
    constructor(lat, lng, country, placeId) {
        //@ts-ignore
        this.lat = lat;
        //@ts-ignore
        this.lng = lng;
        //@ts-ignore
        this.country = country;
        //@ts-ignore
        this.placeId = placeId;
    }
}

function getAirQualityDataSnapshot(firstApiResponse, secondApiResponse) {

    if (promisesResult[0] instanceof Array) {
        return firstApiResponse.map((singleResult, index) => {
            const values = [...singleResult.sensorsdatavalues, ...secondApiResponse[index].sensorsdatavalues];
            const timeStamp = singleResult.timestamp;

            return {
                values,
                timeStamp
            }

        });
    }
    throw new Error('Not an instance of  Array');
}

function mapToAirQualityData(promisesResult) {

    const firstApiResponse = promisesResult[0];
    const secondApiResponse = promisesResult[1];


    function getAirQualityDataLocation({latitude, longitude, country, id}) {
        if (typeof latitude === 'string' &&
            typeof longitude === 'string' &&
            typeof country === 'string' &&
            typeof id === 'number') {

            const lat = Number.parseFloat(latitude);
            const lng = Number.parseFloat(longitude);

            if (isNaN(lat) || isNaN(lng)) {
                throw new Error('Are you serious???')
            }

            return new AirQualityDataLocation(
                latitude,
                longitude,
                country,
                id
            );
        }

        throw new Error('Not an object');

    }

    const location = getAirQualityDataLocation(firstApiResponse[0].location);
    const dataSnapshots = getAirQualityDataSnapshot(firstApiResponse, secondApiResponse);
    const data = new AirQualityData(dataSnapshots, location);

    showData(data);
}

p.then(mapToAirQualityData);

function showData(data) {

    if (!(data instanceof AirQualityData)) {
        throw new Error('Wrong type');
    }

    const mapContainer = document.querySelector('.map');
    const lat = data.location.lat;
    const lng = data.location.lng;
    mapContainer.innerHTML = getMap({width: 450, height: 250}, lat, lng, 16)

    const getLocation = (placeId, countryCode) => {

        let city = '';
        let country = '';

        // Dovrebbe essere convertito da un servizio (function) che ritorna il nome del posto sulla baste del placeId
        if (placeId == 59367)
            city = 'Arnegg'

        // Dovrebbe essere convertito da un servizio (function) che ritorna il nome del country sulla baste del countryCod
        if (countryCode === 'DE')
            country = 'Germania'

        return `${city} (${country})`;
    }

    const locationNameContainer = document.querySelector('.air-quality-item-mapContainer .card-title');
    locationNameContainer.innerHTML = getLocation(data.location.placeId, data.location.country);

    const snapShotsContainer = document.querySelector('.air-quality-item-mapContainer .card-body');

    data.dataSnapshots.forEach((snapshot) => {
        const snapshotElement = getSnapshot(snapshot);
        snapShotsContainer.appendChild(snapshotElement);
    })

}

function getMap({width = 450, height = 250}, lat, lng, zoom > 18);

function getSnapshot(snapshot) {

    const snapshotElement = document.createElement('div');
    snapshotElement.className = 'snapshot-data card mt-3';

    const snapshotValues = snapshot.values.map(v => {

        let value = 0;
        let type = '';

        switch (v.value_type) {
            case 'humidity':
                type = 'Umidita';
                value = `${Math.round(v.value)}%`;
                break;
            case 'temperature':
                type = 'Temperatura';
                value = `${Math.round(v.value)}C`;
                break;
            case 'P1':
                type = 'PM10';
                value = `${v.value}C`;
                break;
            case 'P2':
                type = 'PM25';
                value = `${v.value}C`;
                break;
        }


        return `<li class="list-group-item d-flex">
        <div style="width: 100px">${type}</div>
          <div>${value}</div>
        </li>`;
    }).reduce((c, p) => c + p);

    const dt = new Date(snapshot.timestamp);


    const content = `

      <ul class="list-group list-group-flush">
      ${snapshotValues}
      </ul>
      <div class="card-body" style="text-align: right">
        <strong>${dt.toLocaleDateString('it-IT')} ${dt.toLocaleTimeString('it-IT')}</strong>
      </div>

`;
    snapshotElement.innerHTML = content;

    return snapshotElement;
}