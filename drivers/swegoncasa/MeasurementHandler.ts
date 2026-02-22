import Logger from '../../lib/logger';
import MeasurementType from '../../lib/MeasurementType';
import { Measurement } from '../../types';
import ModeType from '../../lib/ModeType';

export interface TriggerEvent {
  triggerId: string;
  state: Record<string, any>;
  tokens: Record<string, any>;
}

class MeasurementHandler {
  private logger: Logger;
  private previousValues: Map<string, number> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  private getPreviousValue(key: string): number | undefined {
    return this.previousValues.get(key);
  }

  private setPreviousValue(key: string, value: number): void {
    this.previousValues.set(key, value);
  }

  public async HandleMeasurement(
    setCapabilityValue: (capabilityId: string, value: any) => Promise<void>,
    data: Measurement,
    hasCapability: (capabilityId: string) => boolean,
    addCapability: (capabilityId: string) => Promise<void>,
    removeCapability: (capabilityId: string) => Promise<void>,
  ): Promise<TriggerEvent[]> {
    const triggers: TriggerEvent[] = [];

    switch (data.type) {
      case MeasurementType.SupplyTemperature: {
        this.logger.info(`SupplyTemperature: ${data.value}`);
        const prevValue = this.getPreviousValue('supply_temperature');
        await setCapabilityValue('measure_supply_temperature', data.value);
        
        // Temperature changed trigger
        triggers.push({
          triggerId: 'temperature_changed',
          state: { temperature_type: 'supply' },
          tokens: { temperature: data.value },
        });
        
        // Threshold triggers
        if (prevValue !== undefined) {
          triggers.push({
            triggerId: 'temperature_above_threshold',
            state: { temperature_type: 'supply', previousValue: prevValue },
            tokens: { temperature: data.value },
          });
          triggers.push({
            triggerId: 'temperature_below_threshold',
            state: { temperature_type: 'supply', previousValue: prevValue },
            tokens: { temperature: data.value },
          });
        }
        this.setPreviousValue('supply_temperature', data.value);
        break;
      }
      case MeasurementType.ReturnTemperature: {
        this.logger.info(`ReturnTemperature: ${data.value}`);
        const prevValue = this.getPreviousValue('return_temperature');
        await setCapabilityValue('measure_return_temperature', data.value);
        
        triggers.push({
          triggerId: 'temperature_changed',
          state: { temperature_type: 'return' },
          tokens: { temperature: data.value },
        });
        
        if (prevValue !== undefined) {
          triggers.push({
            triggerId: 'temperature_above_threshold',
            state: { temperature_type: 'return', previousValue: prevValue },
            tokens: { temperature: data.value },
          });
          triggers.push({
            triggerId: 'temperature_below_threshold',
            state: { temperature_type: 'return', previousValue: prevValue },
            tokens: { temperature: data.value },
          });
        }
        this.setPreviousValue('return_temperature', data.value);
        break;
      }
      case MeasurementType.IntakeTemperature: {
        this.logger.info(`IntakeTemperature: ${data.value}`);
        const prevValue = this.getPreviousValue('intake_temperature');
        await setCapabilityValue('measure_intake_temperature', data.value);
        
        triggers.push({
          triggerId: 'temperature_changed',
          state: { temperature_type: 'intake' },
          tokens: { temperature: data.value },
        });
        
        if (prevValue !== undefined) {
          triggers.push({
            triggerId: 'temperature_above_threshold',
            state: { temperature_type: 'intake', previousValue: prevValue },
            tokens: { temperature: data.value },
          });
          triggers.push({
            triggerId: 'temperature_below_threshold',
            state: { temperature_type: 'intake', previousValue: prevValue },
            tokens: { temperature: data.value },
          });
        }
        this.setPreviousValue('intake_temperature', data.value);
        break;
      }
      case MeasurementType.HumidityPercent: {
        this.logger.info(`HumidityPercent: ${data.value}`);
        const prevValue = this.getPreviousValue('humidity_percent');
        await setCapabilityValue('measure_humidity_percent', data.value);
        
        triggers.push({
          triggerId: 'humidity_changed',
          state: {},
          tokens: { humidity: data.value },
        });
        
        if (prevValue !== undefined) {
          triggers.push({
            triggerId: 'humidity_above_threshold',
            state: { previousValue: prevValue },
            tokens: { humidity: data.value },
          });
          triggers.push({
            triggerId: 'humidity_below_threshold',
            state: { previousValue: prevValue },
            tokens: { humidity: data.value },
          });
        }
        this.setPreviousValue('humidity_percent', data.value);
        break;
      }
      case MeasurementType.HumidityAmount:
        this.logger.info(`HumidityAmount: ${data.value}`);
        await setCapabilityValue('measure_humidity_amount', data.value);
        break;
      case MeasurementType.CurrentFanSpeed:
        this.logger.info(`CurrentFanSpeed: ${data.value}`);
        await setCapabilityValue('measure_fan_speed', data.value.toString());
        break;
      case MeasurementType.VentilationLevelIn: {
        this.logger.info(`VentilationLevelIn: ${data.value}`);
        const prevValue = this.getPreviousValue('ventilation_level_in');
        await setCapabilityValue('measure_ventilation_level_in', data.value);
        
        triggers.push({
          triggerId: 'ventilation_level_changed',
          state: { ventilation_type: 'supply' },
          tokens: { level: data.value },
        });
        
        if (prevValue !== undefined) {
          triggers.push({
            triggerId: 'ventilation_level_above_threshold',
            state: { ventilation_type: 'supply', previousValue: prevValue },
            tokens: { level: data.value },
          });
          triggers.push({
            triggerId: 'ventilation_level_below_threshold',
            state: { ventilation_type: 'supply', previousValue: prevValue },
            tokens: { level: data.value },
          });
        }
        this.setPreviousValue('ventilation_level_in', data.value);
        break;
      }
      case MeasurementType.VentilationLevelOut: {
        this.logger.info(`VentilationLevelOut: ${data.value}`);
        const prevValue = this.getPreviousValue('ventilation_level_out');
        await setCapabilityValue('measure_ventilation_level_out', data.value);
        
        triggers.push({
          triggerId: 'ventilation_level_changed',
          state: { ventilation_type: 'exhaust' },
          tokens: { level: data.value },
        });
        
        if (prevValue !== undefined) {
          triggers.push({
            triggerId: 'ventilation_level_above_threshold',
            state: { ventilation_type: 'exhaust', previousValue: prevValue },
            tokens: { level: data.value },
          });
          triggers.push({
            triggerId: 'ventilation_level_below_threshold',
            state: { ventilation_type: 'exhaust', previousValue: prevValue },
            tokens: { level: data.value },
          });
        }
        this.setPreviousValue('ventilation_level_out', data.value);
        break;
      }
      case MeasurementType.BoostCountDown:
        this.logger.info(`BoostCountDown: ${data.value}`);
        await setCapabilityValue('measure_boost_countdown', data.value);
        break;
      case MeasurementType.AirQuality: {
        this.logger.info(`AirQuality: ${data.value}`);
        if (data.value > 0) {
          if (!hasCapability('measure_air_quality'))
            await addCapability('measure_air_quality');
          if (!hasCapability(ModeType.AutoAirQualityControlMode))
            await addCapability(ModeType.AutoAirQualityControlMode);
          await setCapabilityValue('measure_air_quality', data.value);
          
          triggers.push({
            triggerId: 'air_quality_changed',
            state: {},
            tokens: { air_quality: data.value },
          });
        } else if (data.value === 0) {
          if (hasCapability('measure_air_quality'))
            await removeCapability('measure_air_quality');
          if (hasCapability(ModeType.AutoAirQualityControlMode))
            await removeCapability(ModeType.AutoAirQualityControlMode);
        }
        break;
      }
      case MeasurementType.CO2: {
        this.logger.info(`CO2: ${data.value}`);
        if (data.value > 0) {
          const prevValue = this.getPreviousValue('co2');
          if (!hasCapability('measure_co2'))
            await addCapability('measure_co2');
          await setCapabilityValue('measure_co2', data.value);
          
          triggers.push({
            triggerId: 'co2_changed',
            state: {},
            tokens: { co2: data.value },
          });
          
          if (prevValue !== undefined) {
            triggers.push({
              triggerId: 'co2_above_threshold',
              state: { previousValue: prevValue },
              tokens: { co2: data.value },
            });
            triggers.push({
              triggerId: 'co2_below_threshold',
              state: { previousValue: prevValue },
              tokens: { co2: data.value },
            });
          }
          this.setPreviousValue('co2', data.value);
        } else if (data.value === 0) {
          if (hasCapability('measure_co2'))
            await removeCapability('measure_co2');
        }
        break;
      }
      default:
        break;
    }

    return triggers;
  }
}

export default MeasurementHandler;
