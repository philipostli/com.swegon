import Logger from '../../lib/logger';
import MeasurementType from '../../lib/MeasurementType';
import { Measurement } from '../../types';
import ModeType from '../../lib/ModeType';

class MeasurementHandler {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public async HandleMeasurement(
    setCapabilityValue: (capabilityId: string, value: any) => Promise<void>,
    data: Measurement,
    hasCapability: (capabilityId: string) => boolean,
    addCapability: (capabilityId: string) => Promise<void>,
    removeCapability: (capabilityId: string) => Promise<void>,
  ): Promise<void> {
    switch (data.type) {
      case MeasurementType.SupplyTemperature:
        this.logger.info(`SupplyTemperature: ${data.value}`);
        await setCapabilityValue('measure_supply_temperature', data.value);
        break;
      case MeasurementType.ReturnTemperature:
        this.logger.info(`ReturnTemperature: ${data.value}`);
        await setCapabilityValue('measure_return_temperature', data.value);
        break;
      case MeasurementType.IntakeTemperature:
        this.logger.info(`IntakeTemperature: ${data.value}`);
        await setCapabilityValue('measure_intake_temperature', data.value);
        break;
      case MeasurementType.HumidityPercent:
        this.logger.info(`HumidityPercent: ${data.value}`);
        await setCapabilityValue('measure_humidity_percent', data.value);
        break;
      case MeasurementType.HumidityAmount:
        this.logger.info(`HumidityAmount: ${data.value}`);
        await setCapabilityValue('measure_humidity_amount', data.value);
        break;
      case MeasurementType.CurrentFanSpeed:
        this.logger.info(`CurrentFanSpeed: ${data.value}`);
        await setCapabilityValue('measure_fan_speed', data.value.toString());
        break;
      case MeasurementType.VentilationLevelIn:
        this.logger.info(`VentilationLevelIn: ${data.value}`);
        await setCapabilityValue('measure_ventilation_level_in', data.value);
        break;
      case MeasurementType.VentilationLevelOut:
        this.logger.info(`VentilationLevelOut: ${data.value}`);
        await setCapabilityValue('measure_ventilation_level_out', data.value);
        break;
      case MeasurementType.BoostCountDown:
        this.logger.info(`BoostCountDown: ${data.value}`);
        await setCapabilityValue('measure_boost_countdown', data.value);
        break;
      case MeasurementType.AirQuality:
        this.logger.info(`AirQuality: ${data.value}`);
        if (data.value > 0) {
          if (!hasCapability('measure_air_quality'))
            await addCapability('measure_air_quality');
          if (!hasCapability(ModeType.AutoAirQualityControlMode))
            await addCapability(ModeType.AutoAirQualityControlMode);
          await setCapabilityValue('measure_air_quality', data.value);
        } else if (data.value === 0) {
          if (hasCapability('measure_air_quality'))
            await removeCapability('measure_air_quality');
          if (hasCapability(ModeType.AutoAirQualityControlMode))
            await removeCapability(ModeType.AutoAirQualityControlMode);
        }
        break;
      default:
        break;
    }
  }
}

export default MeasurementHandler;
