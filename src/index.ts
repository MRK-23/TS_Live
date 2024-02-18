/* async function mockGetAirQualityData(url: string){

      const sensor_71550 = '[{}]';
      const sensor_71551 = '[{}]';

      return new Promise((resolve, reject) => {
        if (url.includes('71550')){
          const p = JSON.parse('sensor_71550');
          resolve(p);
          return;
        }
        if (url.includes('71551')){
          const p = JSON.parse('sensor_71551');
          resolve(p);
          return;
        }

        reject(new Error('id not found'));

      })

    }*/

import {DataLocation, RawAirQualityData, SensorDataValue} from "./types";

async function getAirQualityData(url:string): Promise<Array<RawAirQualityData>>{
    const response = await fetch(url);
    const status = response.ok
    if (status) {
        return await response.json();
    }
    throw new Error('Data not valid');
}

const promises: Array<Promise<Array<RawAirQualityData>>> = [
    getAirQualityData('https://data.sensor.community/airrohr/v1/sensor/71550/'),
    getAirQualityData('https://data.sensor.community/airrohr/v1/sensor/71550/')
];

const p = Promise.all(promises);

class AirQualityData {
    constructor(dataSnapshots: Array<DataSnapshot>, location: AirQualityDataLocation) {
        this.dataSnapshots = dataSnapshots;
        this.location = location;
    }

    public dataSnapshots: Array<DataSnapshot>;
    public location: AirQualityDataLocation;

}

class AirQualityDataLocation {
    // constructor(lat: number, lng: number, country: string, placeId: string | number) {
    //     this.lat = lat;
    //     this.lng = lng;
    //     this.country = country;
    //     this.placeId = placeId;
    //
    // }
    public lat: number | undefined;
    public lng?: number; // SHORTCUT: Equivalent of NUMBER | UNDEFINED
    public country?: string;
    public placeId?: string | number; // Union Type
}

type DataSnapshot = {
    values: Array<SensorDataValue>,
    timeStamp: Date
}

function getAirQualityDataSnapshot(
    firstApiResponse: Array<RawAirQualityData>,
    secondApiResponse: Array<RawAirQualityData>):Array<DataSnapshot> {

    return firstApiResponse.map((singleResult, index) => {
        const values = [...singleResult.sensorsdatavalues, ...secondApiResponse[index].sensorsdatavalues];
        const timeStamp = singleResult.timestamp;

        return {
            values,
            timeStamp
        }

    });
}

function mapToAirQualityData(promisesResult: Array<Array<RawAirQualityData>>) {

    const firstApiResponse: Array<RawAirQualityData> = promisesResult[0];
    const secondApiResponse: Array<RawAirQualityData> = promisesResult[1];

    const location: AirQualityDataLocation = getAirQualityDataLocation(firstApiResponse[0].location);
    const dataSnapshots: Array<DataSnapshot> = getAirQualityDataSnapshot(firstApiResponse, secondApiResponse);
    const data: AirQualityData = new AirQualityData(dataSnapshots, location);

    showData(data);
}

p.then(mapToAirQualityData);

const getAirQualityDataLocation = function({latitude, longitude, country, id}: DataLocation): AirQualityDataLocation {

    const lat = latitude ? Number.parseFloat(latitude) : 0;
    const lng = longitude ? Number.parseFloat(longitude) : 0;

    if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Are you serious???')
    }

    const airQualityDataLocation = new AirQualityDataLocation();
    airQualityDataLocation.lat = lat;
    airQualityDataLocation.lng = lng;
    airQualityDataLocation.country = country;
    airQualityDataLocation.placeId = id;

    return airQualityDataLocation;

}

function showData(data: AirQualityData) {

    const mapContainer: HTMLDivElement | null = document.querySelector('.map')!; // ( ! ) non e nullabile
    const lat = data.location.lat ?? 0;
    const lng = data.location.lng ?? 0;
    mapContainer.innerHTML = getMap({width: 450, height: 250}, lat, lng, 16)

    const getLocation = (placeId: number, countryCode: string) => {

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

    const locationNameContainer: HTMLDivElement = document.querySelector('.air-quality-item-mapContainer .card-title')!;
    const placeId: number | undefined = typeof data.location.placeId === "string" ? Number.parseInt(data.location.placeId) : data.location.placeId:
    locationNameContainer.innerHTML = getLocation(placeId ?? 0, data.location.country ?? "IT");

    const snapShotsContainer = document.querySelector('.air-quality-item-mapContainer .card-body')!;

    data.dataSnapshots.forEach((snapshot) => {
        const snapshotElement = getSnapshot(snapshot);
        snapShotsContainer.appendChild(snapshotElement);
    })

}

function getMap({width = 450, height = 250}, lat:number, lng: number): any;

function getSnapshot(snapshot: DataSnapshot):HTMLDivElement {

    const snapshotElement = document.createElement('div');
    snapshotElement.className = 'snapshot-data card mt-3';

    const snapshotValues = snapshot.values.map(v => {

        let value = 0;
        let type = '';

        let v1: number = v.value ? Number.parseInt(v.value) : 0;

        switch (v.value_type) {
            case 'humidity':
                type = 'Umidita';
                value = `${Math.round(v1)}%`;
                break;
            case 'temperature':
                type = 'Temperatura';
                value = `${Math.round(v1)}C`;
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
