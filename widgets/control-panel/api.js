'use strict';

module.exports = {
  async getUnitState({ homey, query }) {

    const selectedDeviceId = query.deviceId;
    const driver = await homey.drivers.getDriver('swegoncasa');
    const devices = driver.getDevices();
    const selectedDevice = devices.find(device => device.getId() === selectedDeviceId);
    const name = await selectedDevice.getName();

    let state = await selectedDevice.getCapabilityValue('climate_mode');
    let fanSpeed = await selectedDevice.getCapabilityValue('measure_ventilation_level_in');
    let humidityPercent = await selectedDevice.getCapabilityValue('measure_humidity_percent');
    let intakeTemperature = await selectedDevice.getCapabilityValue('measure_intake_temperature');
    let returnTemperature = await selectedDevice.getCapabilityValue('measure_return_temperature');
    let airQuality = await selectedDevice.getCapabilityValue('measure_air_quality');

    return {
      name,
      state,
      fanSpeed,
      humidityPercent,
      intakeTemperature: intakeTemperature ? Number(intakeTemperature).toFixed(1) : null,
      returnTemperature: returnTemperature ? Number(returnTemperature).toFixed(1) : null,
      airQuality: airQuality ? Number(airQuality) : null
    };
  },
  async setClimateMode({ homey, query, body }) {
    const selectedDeviceId = query.deviceId;
    const driver = await homey.drivers.getDriver('swegoncasa');
    const devices = driver.getDevices();
    const selectedDevice = devices.find(device => device.getId() === selectedDeviceId);

    await selectedDevice.setCapabilityValue('climate_mode', body.climateMode);
    await selectedDevice.triggerCapabilityListener('climate_mode', body.climateMode);
  }
};
