

export type DataLocation = {
    latitude?: string,
    longitude?: string,
    country?: string,
    id?: number,
    // miaFunction(location: DataLocation): number;
}

export type SensorDataValue = {
    value?: string,
    value_type?: string,
    id?: number
}

// DTO data transfer project

export type RawAirQualityData = {
    sampling_rate?: any,
    timestamp: Date,
    sensorsdatavalues: Array<SensorDataValue>,
    location: DataLocation
}