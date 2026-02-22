import Homey from 'homey';

class SwegonCasa extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit(): Promise<void> {
    // Register Action Cards
    this.registerActionCards();

    // Register Trigger Cards
    this.registerTriggerCards();

    // Register Condition Cards
    this.registerConditionCards();

    this.log('SwegonCasa has been initialized');
  }

  private registerActionCards(): void {
    // Set Climate Mode
    this.homey.flow
      .getActionCard('set_climate_mode')
      .registerRunListener((args) =>
        args.device.onClimateModeActionTriggered(args.climate_mode),
      );

    // Set Temperature
    this.homey.flow
      .getActionCard('set_temperature')
      .registerRunListener((args) =>
        args.device.onSetTemperatureActionTriggered(args.temperature),
      );

    // Set Summer Night Cooling Mode
    this.homey.flow
      .getActionCard('set_summer_night_cooling_mode')
      .registerRunListener((args) =>
        args.device.onSetSummerNightCoolingModeActionTriggered(args.mode),
      );

    // Set Auto Humidity Control Mode
    this.homey.flow
      .getActionCard('set_auto_humidity_control_mode')
      .registerRunListener((args) =>
        args.device.onSetAutoHumidityControlModeActionTriggered(args.mode),
      );

    // Set Auto Air Quality Control Mode
    this.homey.flow
      .getActionCard('set_auto_air_quality_control_mode')
      .registerRunListener((args) =>
        args.device.onSetAutoAirQualityControlModeActionTriggered(args.mode),
      );
  }

  private registerTriggerCards(): void {
    // Temperature Changed - filter by temperature type
    this.homey.flow
      .getDeviceTriggerCard('temperature_changed')
      .registerRunListener((args, state) => {
        return args.temperature_type === state.temperature_type;
      });

    // Temperature Above Threshold
    this.homey.flow
      .getDeviceTriggerCard('temperature_above_threshold')
      .registerRunListener((args, state) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { threshold, temperature_type } = args;
        const { previousValue } = state;
        const temperatureType = temperature_type;
        const temperatureCapabilities = {
          supply: 'measure_supply_temperature',
          intake: 'measure_intake_temperature',
          return: 'measure_return_temperature',
        } as const;
        const currentValue = args.device.getCapabilityValue(
          temperatureCapabilities[temperatureType as keyof typeof temperatureCapabilities],
        );
        
        // Check if type matches and value crossed threshold from below
        return temperature_type === state.temperature_type && 
               previousValue !== undefined && 
               previousValue <= threshold && 
               currentValue > threshold;
      });

    // Temperature Below Threshold
    this.homey.flow
      .getDeviceTriggerCard('temperature_below_threshold')
      .registerRunListener((args, state) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { threshold, temperature_type } = args;
        const { previousValue } = state;
        const temperatureType = temperature_type;
        const temperatureCapabilities = {
          supply: 'measure_supply_temperature',
          intake: 'measure_intake_temperature',
          return: 'measure_return_temperature',
        } as const;
        const currentValue = args.device.getCapabilityValue(
          temperatureCapabilities[temperatureType as keyof typeof temperatureCapabilities],
        );
        
        return temperature_type === state.temperature_type && 
               previousValue !== undefined && 
               previousValue >= threshold && 
               currentValue < threshold;
      });

    // Ventilation Level Changed
    this.homey.flow
      .getDeviceTriggerCard('ventilation_level_changed')
      .registerRunListener((args, state) => {
        return args.ventilation_type === state.ventilation_type;
      });

    // Ventilation Level Above Threshold
    this.homey.flow
      .getDeviceTriggerCard('ventilation_level_above_threshold')
      .registerRunListener((args, state) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { threshold, ventilation_type } = args;
        const { previousValue } = state;
        const ventilationType = ventilation_type;
        const ventilationCapabilities = {
          supply: 'measure_ventilation_level_in',
          exhaust: 'measure_ventilation_level_out',
        } as const;
        const currentValue = args.device.getCapabilityValue(
          ventilationCapabilities[ventilationType as keyof typeof ventilationCapabilities],
        );
        
        return ventilation_type === state.ventilation_type && 
               previousValue !== undefined && 
               previousValue <= threshold && 
               currentValue > threshold;
      });

    // Ventilation Level Below Threshold
    this.homey.flow
      .getDeviceTriggerCard('ventilation_level_below_threshold')
      .registerRunListener((args, state) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { threshold, ventilation_type } = args;
        const { previousValue } = state;
        const ventilationType = ventilation_type;
        const ventilationCapabilities = {
          supply: 'measure_ventilation_level_in',
          exhaust: 'measure_ventilation_level_out',
        } as const;
        const currentValue = args.device.getCapabilityValue(
          ventilationCapabilities[ventilationType as keyof typeof ventilationCapabilities],
        );
        
        return ventilation_type === state.ventilation_type && 
               previousValue !== undefined && 
               previousValue >= threshold && 
               currentValue < threshold;
      });

    // Humidity Changed - no filtering needed
    this.homey.flow
      .getDeviceTriggerCard('humidity_changed')
      .registerRunListener(() => true);

    // Humidity Above Threshold
    this.homey.flow
      .getDeviceTriggerCard('humidity_above_threshold')
      .registerRunListener((args, state) => {
        const { threshold } = args;
        const { previousValue } = state;
        const currentValue = args.device.getCapabilityValue('measure_humidity_percent');
        
        return previousValue !== undefined && 
               previousValue <= threshold && 
               currentValue > threshold;
      });

    // Humidity Below Threshold
    this.homey.flow
      .getDeviceTriggerCard('humidity_below_threshold')
      .registerRunListener((args, state) => {
        const { threshold } = args;
        const { previousValue } = state;
        const currentValue = args.device.getCapabilityValue('measure_humidity_percent');
        
        return previousValue !== undefined && 
               previousValue >= threshold && 
               currentValue < threshold;
      });

    // CO2 Changed - no filtering needed
    this.homey.flow
      .getDeviceTriggerCard('co2_changed')
      .registerRunListener(() => true);

    // CO2 Above Threshold
    this.homey.flow
      .getDeviceTriggerCard('co2_above_threshold')
      .registerRunListener((args, state) => {
        const { threshold } = args;
        const { previousValue } = state;
        const currentValue = args.device.getCapabilityValue('measure_co2');
        
        return previousValue !== undefined && 
               previousValue <= threshold && 
               currentValue > threshold;
      });

    // CO2 Below Threshold
    this.homey.flow
      .getDeviceTriggerCard('co2_below_threshold')
      .registerRunListener((args, state) => {
        const { threshold } = args;
        const { previousValue } = state;
        const currentValue = args.device.getCapabilityValue('measure_co2');
        
        return previousValue !== undefined && 
               previousValue >= threshold && 
               currentValue < threshold;
      });

    // Air Quality Changed - no filtering needed
    this.homey.flow
      .getDeviceTriggerCard('air_quality_changed')
      .registerRunListener(() => true);

    // Climate Mode Changed - no filtering needed
    this.homey.flow
      .getDeviceTriggerCard('climate_mode_changed')
      .registerRunListener(() => true);
  }

  private registerConditionCards(): void {
    // Temperature Is Above
    this.homey.flow
      .getConditionCard('temperature_is_above')
      .registerRunListener((args) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { temperature_type, threshold } = args;
        const temperatureType = temperature_type;
        const temperatureCapabilities = {
          supply: 'measure_supply_temperature',
          intake: 'measure_intake_temperature',
          return: 'measure_return_temperature',
        } as const;
        const currentValue = args.device.getCapabilityValue(
          temperatureCapabilities[temperatureType as keyof typeof temperatureCapabilities],
        );
        return currentValue > threshold;
      });

    // Temperature Is Below
    this.homey.flow
      .getConditionCard('temperature_is_below')
      .registerRunListener((args) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { temperature_type, threshold } = args;
        const temperatureType = temperature_type;
        const temperatureCapabilities = {
          supply: 'measure_supply_temperature',
          intake: 'measure_intake_temperature',
          return: 'measure_return_temperature',
        } as const;
        const currentValue = args.device.getCapabilityValue(
          temperatureCapabilities[temperatureType as keyof typeof temperatureCapabilities],
        );
        return currentValue < threshold;
      });

    // Humidity Is Above
    this.homey.flow
      .getConditionCard('humidity_is_above')
      .registerRunListener((args) => {
        const currentValue = args.device.getCapabilityValue('measure_humidity_percent');
        return currentValue > args.threshold;
      });

    // Humidity Is Below
    this.homey.flow
      .getConditionCard('humidity_is_below')
      .registerRunListener((args) => {
        const currentValue = args.device.getCapabilityValue('measure_humidity_percent');
        return currentValue < args.threshold;
      });

    // CO2 Is Above
    this.homey.flow
      .getConditionCard('co2_is_above')
      .registerRunListener((args) => {
        const currentValue = args.device.getCapabilityValue('measure_co2');
        return currentValue > args.threshold;
      });

    // CO2 Is Below
    this.homey.flow
      .getConditionCard('co2_is_below')
      .registerRunListener((args) => {
        const currentValue = args.device.getCapabilityValue('measure_co2');
        return currentValue < args.threshold;
      });

    // Climate Mode Is
    this.homey.flow
      .getConditionCard('climate_mode_is')
      .registerRunListener((args) => {
        const currentMode = args.device.getCapabilityValue('climate_mode');
        return currentMode === args.climate_mode;
      });
  }
}

module.exports = SwegonCasa;
