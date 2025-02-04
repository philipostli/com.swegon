import Homey from 'homey';

class SwegonCasa extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit(): Promise<void> {
    this.homey.flow
      .getActionCard('set_climate_mode')
      .registerRunListener((args, state) =>
        args.device.onClimateModeActionTriggered(args.climate_mode),
      );

    this.log('SwegonCasa has been initialized');
  }
}

module.exports = SwegonCasa;
