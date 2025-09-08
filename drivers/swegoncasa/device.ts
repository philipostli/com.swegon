import Homey from 'homey';
import ClimateModes from '../../lib/ClimateModes';
import Logger from '../../lib/logger';
import SwegonClient from './SwegonClient';
import { Measurement, DeviceInfo, ConnectionInfo, Mode } from '../../types';
import { SettingsChangedEvent } from '../../types/homey';
import MeasurementHandler from './MeasurementHandler';
import SettingsHandler from './SettingsHandler';
import SummerNightCoolingModes from '../../lib/SummerNightCoolingModes';
import ModeHandler from './ModeHandler';
import ModeType from '../../lib/ModeType';
import SwegonObjectId from '../../lib/SwegonObjectId';
import AutoHumidityControlModes from '../../lib/AutoHumidityControlModes';
import AutoAirQualityControlModes from '../../lib/AutoAirQualityControlModes';

class SwegonCasaDevice extends Homey.Device {
  private logger = new Logger(this.log, this.error, true);
  private swegonClient: SwegonClient | undefined;
  private measurementHandler = new MeasurementHandler(this.logger);
  private settingsHandler = new SettingsHandler(this.logger);
  private modeHandler = new ModeHandler(this.logger);

  private async ensureInitialized(settings: any): Promise<void> {
    this.logger = new Logger(this.log, this.error, settings.debugMode === true);

    this.measurementHandler = new MeasurementHandler(this.logger);
    this.settingsHandler = new SettingsHandler(this.logger);
    this.modeHandler = new ModeHandler(this.logger);

    // Add any missing settings
    if (!settings.temperatureControlMode) {
      this.setSettings({ temperatureControlMode: 'comfort' });
    }

    if (!settings.summerNightCoolingBoost) {
      this.setSettings({ summerNightCoolingBoost: 'off' });
    }
  }

  /** Add capabilities if they do not already exist */
  private async ensureCapabilities(): Promise<void> {
    if (!this.hasCapability(ModeType.ClimateMode)) {
      await this.addCapability(ModeType.ClimateMode);
    }

    if (!this.hasCapability('measure_supply_temperature')) {
      await this.addCapability('measure_supply_temperature');
    }

    if (!this.hasCapability('measure_intake_temperature')) {
      await this.addCapability('measure_intake_temperature');
    }

    if (!this.hasCapability('measure_return_temperature')) {
      await this.addCapability('measure_return_temperature');
    }

    if (!this.hasCapability('measure_humidity_percent')) {
      await this.addCapability('measure_humidity_percent');
    }

    if (!this.hasCapability('measure_humidity_amount')) {
      await this.addCapability('measure_humidity_amount');
    }

    if (!this.hasCapability('measure_fan_speed')) {
      await this.addCapability('measure_fan_speed');
    }

    if (!this.hasCapability('measure_boost_countdown')) {
      await this.addCapability('measure_boost_countdown');
    }

    if (!this.hasCapability('measure_ventilation_level_in')) {
      await this.addCapability('measure_ventilation_level_in');
    }

    if (!this.hasCapability('measure_ventilation_level_out')) {
      await this.addCapability('measure_ventilation_level_out');
    }

    if (!this.hasCapability(ModeType.SummerNightCoolingMode)) {
      await this.addCapability(ModeType.SummerNightCoolingMode);
    }

    if (!this.hasCapability(ModeType.AutoHumidityControlMode)) {
      await this.addCapability(ModeType.AutoHumidityControlMode);
    }

    if (!this.hasCapability(ModeType.AutoAirQualityControlMode)) {
      await this.addCapability(ModeType.AutoAirQualityControlMode);
    }

    if (!this.hasCapability('measure_air_quality')) {
      await this.addCapability('measure_air_quality');
    }
  }

  private async onMeasurement(data: Measurement): Promise<void> {
    try {
      await this.measurementHandler.HandleMeasurement(
        this.setCapabilityValue.bind(this),
        data,
        this.hasCapability.bind(this),
        this.addCapability.bind(this),
        this.removeCapability.bind(this),
      );
    } catch (err) {
      this.logger.error(err);
    }
  }

  private async onMode(data: Mode): Promise<void> {
    try {
      this.logger.info(`Mode: ${data.id}=${data.value}`);

      await this.modeHandler.HandleMode(
        data.id,
        data.value,
        this.setCapabilityValue.bind(this),
      );
    } catch (err) {
      this.logger.error(err);
    }
  }

  private async onSetting(id: string, value: string): Promise<void> {
    try {
      this.logger.info(`Setting: ${id}=${value}`);

      const newSetting: any = {};
      newSetting[id] = value;

      await this.settingsHandler.HandleDeviceSettingChanged(
        this.setSettings.bind(this),
        this.setCapabilityValue.bind(this),
        newSetting,
        this.swegonClient,
      );

      // Reinitialize if needed
      await this.ensureInitialized(await this.getSettings());
    } catch (err) {
      this.logger.error(err);
    }
  }

  private async onDeviceInfo(data: DeviceInfo): Promise<void> {
    try {
      this.logger.info(`DeviceInfo: ${JSON.stringify(data)}`);
      await this.setSettings({
        serialNumber: data.serialNumber,
      });
    } catch (err) {
      this.logger.error(err);
    }
  }

  private async onConnectionInfo(data: ConnectionInfo): Promise<void> {
    try {
      this.logger.info(`ConnectionInfo: ${JSON.stringify(data)}`);
      await this.setSettings({
        connectionId: data.id,
        connectionName: data.deviceName,
        connectionSerialNumber: data.serialNumber,
      });
    } catch (err) {
      this.logger.error(err);
    }
  }

  private async changeClimateMode(value: string): Promise<void> {
    const currentMode = this.getCapabilityValue(ModeType.ClimateMode);
    const mode = ClimateModes.find((x) => x.id === value);

    if (mode) {
      this.swegonClient?.setClimateMode(currentMode, mode.value);
    }
  }

  public async onClimateModeActionTriggered(
    climateMode: string,
  ): Promise<void> {
    this.logger.info(
      `${ModeType.ClimateMode} Updated from Action: ${climateMode}`,
    );

    await this.changeClimateMode(climateMode);
  }

  /**
   * onInit is called when the device is initialized.
   */
  async onInit(): Promise<void> {
    this.logger.info(`Initializing ${this.getName()}`);

    await this.ensureCapabilities();

    const settings = this.getSettings();

    await this.ensureInitialized(settings);

    const data = this.getData();

    this.logger.info('Device ID', data.id);
    this.logger.info('Username', settings.username);

    const swegonClient = new SwegonClient(
      settings.username,
      settings.password,
      this.logger,
    );

    await swegonClient.login();
    await swegonClient.connect(data.id);

    this.registerCapabilityListener(
      ModeType.ClimateMode,
      async (value: string) => {
        this.logger.info(`${ModeType.ClimateMode} Changed: ${value}`);

        await this.changeClimateMode(value);
      },
    );

    this.registerCapabilityListener(
      ModeType.SummerNightCoolingMode,
      async (value: string) => {
        this.logger.info(
          `${ModeType.SummerNightCoolingMode} Changed: ${value}`,
        );

        const mode = SummerNightCoolingModes.find((x) => x.id === value);

        if (mode) {
          swegonClient.setValue(
            SwegonObjectId.SummerNightCoolingMode,
            mode.value,
          );
        }
      },
    );

    this.registerCapabilityListener(
      ModeType.AutoHumidityControlMode,
      async (value: string) => {
        this.logger.info(
          `${ModeType.AutoHumidityControlMode} Changed: ${value}`,
        );

        const mode = AutoHumidityControlModes.find((x) => x.id === value);

        if (mode) {
          swegonClient.setValue(
            SwegonObjectId.AutoHumidityControlMode,
            mode.value,
          );
        }
      },
    );

    this.registerCapabilityListener(
      ModeType.AutoAirQualityControlMode,
      async (value: string) => {
        this.logger.info(
          `${ModeType.AutoAirQualityControlMode} Changed: ${value}`,
        );

        const mode = AutoAirQualityControlModes.find((x) => x.id === value);

        if (mode) {
          swegonClient.setValue(
            SwegonObjectId.AutoAirQualityControlMode,
            mode.value,
          );
        }
      },
    );

    swegonClient.onMeasurement(this.onMeasurement.bind(this));
    swegonClient.onDeviceInfo(this.onDeviceInfo.bind(this));
    swegonClient.onConnectionInfo(this.onConnectionInfo.bind(this));
    swegonClient.onMode(this.onMode.bind(this));
    swegonClient.onSetting(this.onSetting.bind(this));

    this.swegonClient = swegonClient;

    this.logger.info(`Initialized ${this.getName()}`);
  }

  async onUninit(): Promise<void> {
    this.swegonClient?.destroy();
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded(): Promise<void> {
    this.logger.debug('A SwegonCasa device has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({
    oldSettings,
    newSettings,
    changedKeys,
  }: SettingsChangedEvent): Promise<string | void> {
    await this.settingsHandler.HandleHomeySettingChanged(
      {
        oldSettings,
        newSettings,
        changedKeys,
      },
      this.swegonClient,
    );

    // Reinitialize if needed
    await this.ensureInitialized(await this.getSettings());
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name: string): Promise<void> {
    this.logger.debug('A SwegonCasa device was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted(): Promise<void> {
    this.logger.debug('A SwegonCasa device has been deleted');
  }
}

module.exports = SwegonCasaDevice;
