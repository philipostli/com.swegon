import Homey from 'homey';
import type PairSession from 'homey/lib/PairSession';
import Logger from '../../lib/logger';
import SwegonClient from './SwegonClient';
import { SwegonDevice } from '../../types/swegon';

class SwegonCasaDriver extends Homey.Driver {
  private logger = new Logger(this.log, this.error, true);

  async onPair(session: PairSession): Promise<void> {
    let username = '';
    let password = '';

    session.setHandler('login', async (data: any) => {
      username = data.username;
      password = data.password;

      const swegonClient = new SwegonClient(username, password, this.logger);

      const loginResult = await swegonClient.login();

      // return true to continue adding the device if the login succeeded
      // return false to indicate to the user the login attempt failed
      // thrown errors will also be shown to the user
      return loginResult?.token != null;
    });

    session.setHandler('list_devices', async () => {
      const swegonClient = new SwegonClient(username, password, this.logger);
      const devices = await swegonClient.getDevices();

      const result = devices.map((device: SwegonDevice) => {
        return {
          name: device.name,
          data: {
            id: device.id,
          },
          settings: {
            username,
            password,
          },
        };
      });

      return result;
    });
  }
}

module.exports = SwegonCasaDriver;
