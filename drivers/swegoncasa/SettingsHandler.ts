import Logger from '../../lib/logger';
import { SettingsChangedEvent, HomeySetting } from '../../types/homey';
import SwegonClient from './SwegonClient';
import SettingType from '../../lib/SettingType';
import SummerNightCoolingBoost from '../../lib/SummerNightCoolingBoost';
import Utils from '../../lib/Utils';
import SwegonObjectId from '../../lib/SwegonObjectId';

class SettingsHandler {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public async HandleHomeySettingChanged(
    { oldSettings, newSettings, changedKeys }: SettingsChangedEvent,
    swegonClient?: SwegonClient,
  ): Promise<void> {
    this.logger.debug(`Homey Setting changed: ${JSON.stringify(newSettings)}`);

    // Temperature Control Mode
    if (newSettings[SettingType.TemperatureControlMode]) {
      const temperatureControlMode =
        newSettings[SettingType.TemperatureControlMode] === 'comfort' ? 2 : 1;
      await swegonClient?.setValue(
        SwegonObjectId.TemperatureControlMode,
        temperatureControlMode,
      );
    }

    // Summer Night Cooling Boost
    if (newSettings[SettingType.SummerNightCoolingBoost]) {
      const boost = SummerNightCoolingBoost?.values?.find(
        (x) => x.id === newSettings[SettingType.SummerNightCoolingBoost],
      );

      if (boost?.value != null) {
        await swegonClient?.setValue(
          SwegonObjectId.SummerNightCoolingBoost,
          boost.value,
        );
      }
    }

    // Auto Humidity Control Boost Limit
    if (newSettings[SettingType.AutoHumidityControlBoostLimit]) {
      await swegonClient?.setValue(
        SwegonObjectId.AutoHumidityControlBoostLimit,
        newSettings[SettingType.AutoHumidityControlBoostLimit],
      );
    }

    // Auto Humidity Control Full Boost Limit
    if (newSettings[SettingType.AutoHumidityControlFullBoostLimit]) {
      await swegonClient?.setValue(
        SwegonObjectId.AutoHumidityControlFullBoostLimit,
        newSettings[SettingType.AutoHumidityControlFullBoostLimit],
      );
    }

    // Travelling Mode Temperature Drop
    if (newSettings[SettingType.TravellingModeTemperatureDrop]) {
      await swegonClient?.setValue(
        SwegonObjectId.TravellingModeTemperatureDrop,
        newSettings[SettingType.TravellingModeTemperatureDrop],
      );
    }

    // Away Mode Temperature Drop
    if (newSettings[SettingType.AwayModeTemperatureDrop]) {
      await swegonClient?.setValue(
        SwegonObjectId.AwayModeTemperatureDrop,
        newSettings[SettingType.AwayModeTemperatureDrop],
      );
    }

    // Supply Temperature Setpoint
    if (newSettings[SettingType.SupplyTemperatureSetpoint]) {
      await swegonClient?.setValue(
        SwegonObjectId.SupplyTemperatureSetpoint,
        newSettings[SettingType.SupplyTemperatureSetpoint],
      );
    }
  }

  public async HandleDeviceSettingChanged(
    setSettings: (settings: any) => Promise<void>,
    setCapabilityValue: (capabilityId: string, value: any) => Promise<void>,
    newSetting: any,
    swegonClient?: SwegonClient,
  ): Promise<void> {
    this.logger.debug(`Device Setting changed: ${JSON.stringify(newSetting)}`);

    // Temperature Control Mode
    if (newSetting[SettingType.TemperatureControlMode]) {
      newSetting[SettingType.TemperatureControlMode] =
        newSetting[SettingType.TemperatureControlMode].toString() === '2'
          ? 'comfort'
          : 'eco';
    }

    // Summer Night Cooling Boost
    if (newSetting[SettingType.SummerNightCoolingBoost]) {
      const boost = SummerNightCoolingBoost?.values?.find(
        (x) => x.value === newSetting[SettingType.SummerNightCoolingBoost],
      );

      if (boost) {
        newSetting[SettingType.SummerNightCoolingBoost] = boost.id;
      }
    }

    await setSettings(newSetting);
  }
}

export default SettingsHandler;
