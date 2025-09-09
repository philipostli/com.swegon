import AutoHumidityControlModes from '../../lib/AutoHumidityControlModes';
import ClimateModes from '../../lib/ClimateModes';
import Logger from '../../lib/logger';
import ModeType from '../../lib/ModeType';
import SummerNightCoolingModes from '../../lib/SummerNightCoolingModes';
import AutoAirQualityControlModes from '../../lib/AutoAirQualityControlModes';

class ModeHandler {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  public async HandleMode(
    id: string,
    value: any,
    setCapabilityValue: (capabilityId: string, value: any) => Promise<void>,
    hasCapability: (capabilityId: string) => boolean,
  ): Promise<void> {
    if (id === ModeType.SummerNightCoolingMode) {
      const coolingMode = SummerNightCoolingModes.find(
        (x) => x.value === value,
      );

      this.logger.info(`SummerNightCoolingMode: ${value} (${coolingMode?.id})`);

      if (coolingMode) {
        await setCapabilityValue(
          ModeType.SummerNightCoolingMode,
          coolingMode.id,
        );
      } else {
        throw new Error(`Invalid mode ${value}`);
      }
    } else if (id === ModeType.ClimateMode) {
      const climateMode = ClimateModes.find((x) => x.value === value);

      this.logger.info(`ClimateMode: ${value} (${climateMode?.id})`);

      if (climateMode) {
        await setCapabilityValue(ModeType.ClimateMode, climateMode.id);
      } else {
        throw new Error(`Invalid mode ${value}`);
      }
    } else if (id === ModeType.AutoHumidityControlMode) {
      const mode = AutoHumidityControlModes.find((x) => x.value === value);

      this.logger.info(`AutoHumidityControlMode: ${value} (${mode?.id})`);

      if (mode) {
        await setCapabilityValue(ModeType.AutoHumidityControlMode, mode.id);
      } else {
        throw new Error(`Invalid mode ${value}`);
      }
    } else if (id === ModeType.AutoAirQualityControlMode) {
      const mode = AutoAirQualityControlModes.find((x) => x.value === value);

      this.logger.info(`AutoAirQualityControlMode: ${value} (${mode?.id})`);

      if (mode) {
        if(hasCapability(ModeType.AutoAirQualityControlMode))
          await setCapabilityValue(ModeType.AutoAirQualityControlMode, mode.id);
      } else {
        throw new Error(`Invalid mode ${value}`);
      }
    }
  }
}

export default ModeHandler;
