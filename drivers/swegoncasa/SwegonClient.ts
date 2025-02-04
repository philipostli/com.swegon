import { EventEmitter } from 'events';
import axios from 'axios';
import WebSocket from 'ws';
import Logger from '../../lib/logger';
import {
  SwegonBaseMessage,
  SwegonDevice,
  SwegonConnectionMessage,
  SwegonDeviceMessage,
  SwegonLoginResult,
  SwegonMeasurementMessage,
  SwegonWebsocketConfig,
  SwegonClimateMode,
} from '../../types/swegon';
import SettingType from '../../lib/SettingType';
import MeasurementType from '../../lib/MeasurementType';
import SwegonConstants from './SwegonConstants';
import SwegonObjectId from '../../lib/SwegonObjectId';
import SwegonPropertyType from '../../lib/SwegonPropertyType';
import { ConnectionInfo, DeviceInfo, Measurement, Mode } from '../../types';
import ModeType from '../../lib/ModeType';

const SwegonCasaOrigin = 'https://swegoncasa.io';

class SwegonClient {
  private username = '';
  private password = '';
  private token = '';
  private ws: WebSocket | null = null;
  private eventHandler: EventEmitter;
  private logger: Logger;
  private timestamp: Date = new Date();

  constructor(username: string, password: string, logger: Logger) {
    this.username = username;
    this.password = password;
    this.eventHandler = new EventEmitter();
    this.logger = logger;
  }

  public onMode(callback: (data: Mode) => Promise<void>): void {
    this.eventHandler.on('mode', async (data) => callback(data));
  }

  public onMeasurement(callback: (data: Measurement) => Promise<void>): void {
    this.eventHandler.on('measurement', async (data) => callback(data));
  }

  public onDeviceInfo(callback: (data: DeviceInfo) => Promise<void>): void {
    this.eventHandler.on('deviceInfo', async (data) => callback(data));
  }

  public onConnectionInfo(
    callback: (data: ConnectionInfo) => Promise<void>,
  ): void {
    this.eventHandler.on('connectionInfo', async (data) => callback(data));
  }

  public onSetting(
    callback: (id: string, value: string) => Promise<void>,
  ): void {
    this.eventHandler.on('setting', async ({ id, value }) =>
      callback(id, value),
    );
  }

  public async setValue(id: SwegonObjectId, value: number): Promise<void> {
    if (this.ws) {
      const writeArgs = {
        name: 'message',
        args: [JSON.stringify(SwegonConstants.WriteArgs(id, value))],
      };

      this.logger.debug('Sending message to Swegon', writeArgs);

      this.ws.send(`42${JSON.stringify(writeArgs)}`);
    }
  }

  public async setClimateMode(
    currentValue: SwegonClimateMode,
    newValue: SwegonClimateMode,
  ): Promise<void> {
    if (this.ws && newValue !== currentValue) {
      // Reset Travel mode if currently in Travel mode
      if (currentValue === SwegonClimateMode.Travel) {
        const travelArgs = {
          name: 'message',
          args: [JSON.stringify(SwegonConstants.WriteArgs('112', 0))],
        };

        this.ws.send(`42${JSON.stringify(travelArgs)}`);
      }

      // Reset Fireplace mode if currently in Fireplace mode
      if (currentValue === SwegonClimateMode.Fireplace) {
        const fireplaceArgs = {
          name: 'message',
          args: [JSON.stringify(SwegonConstants.WriteArgs('153', 0))],
        };
        const fireplaceArgs2 = {
          name: 'message',
          args: [JSON.stringify(SwegonConstants.WriteArgs('154', 0))],
        };

        this.ws.send(`42${JSON.stringify(fireplaceArgs)}`);
        this.ws.send(`42${JSON.stringify(fireplaceArgs2)}`);
      }

      // Set fan speed value
      if (
        newValue === SwegonClimateMode.Away ||
        newValue === SwegonClimateMode.Home ||
        newValue === SwegonClimateMode.Boost
      ) {
        const fanSpeedArgs = {
          name: 'message',
          args: [
            JSON.stringify(
              SwegonConstants.WriteArgs(SwegonObjectId.SetFanSpeed, newValue),
            ),
          ],
        };

        this.logger.info(`Setting Fan Speed to ${newValue}`);
        this.logger.debug('Sending message to Swegon', fanSpeedArgs);

        this.ws.send(`42${JSON.stringify(fanSpeedArgs)}`);
      }

      // Turn on
      if (currentValue === SwegonClimateMode.Off) {
        const onArgs = {
          name: 'message',
          args: [
            JSON.stringify(
              SwegonConstants.WriteArgs(SwegonObjectId.TurnOff, 0),
            ),
          ],
        };

        // TODO: Not sure what this does yet
        const onArgs2 = {
          name: 'message',
          args: [JSON.stringify(SwegonConstants.WriteArgs('156', 1))],
        };

        this.ws.send(`42${JSON.stringify(onArgs)}`);
        this.ws.send(`42${JSON.stringify(onArgs2)}`);
      }

      // Turn off
      if (newValue === SwegonClimateMode.Off) {
        const offArgs = {
          name: 'message',
          args: [
            JSON.stringify(
              SwegonConstants.WriteArgs(SwegonObjectId.TurnOff, 1),
            ),
          ],
        };

        this.ws.send(`42${JSON.stringify(offArgs)}`);
      }

      // TODO: Not sure what this does yet, but swegoncasa.io does it so we do as well
      if (newValue === SwegonClimateMode.Boost) {
        const boostArgs = {
          name: 'message',
          args: [JSON.stringify(SwegonConstants.WriteArgs('116', 1))],
        };

        this.ws.send(`42${JSON.stringify(boostArgs)}`);
      }

      // TODO: Not sure what this does yet, but swegoncasa.io does it so we do as well
      if (newValue === SwegonClimateMode.Fireplace) {
        const fireplaceArgs = {
          name: 'message',
          args: [JSON.stringify(SwegonConstants.WriteArgs('153', 1))],
        };

        this.ws.send(`42${JSON.stringify(fireplaceArgs)}`);
      }

      // TODO: Not sure what this does yet, but swegoncasa.io does it so we do as well
      if (newValue === SwegonClimateMode.Travel) {
        const travelArgs = {
          name: 'message',
          args: [JSON.stringify(SwegonConstants.WriteArgs('112', 1))],
        };

        const travelArgs2 = {
          name: 'message',
          args: [JSON.stringify(SwegonConstants.WriteArgs('154', 1))],
        };

        this.ws.send(`42${JSON.stringify(travelArgs)}`);
        this.ws.send(`42${JSON.stringify(travelArgs2)}`);
      }
    }
  }

  public async connect(deviceId: string): Promise<void> {
    try {
      this.timestamp = new Date();

      const url = `wss://oulite.ouman.io/socket.io/?EIO=4&transport=websocket`;

      this.logger.info(
        `Connecting to websocket - Url: ${url}, Device ID: ${deviceId}`,
      );

      const ws = new WebSocket(url, {
        origin: SwegonCasaOrigin,
      });

      ws.on('open', () => {
        this.logger.info('WebSocket Connected');

        // Send connect packet med autentisering
        const connectData = {
          deviceid: deviceId,
          date: new Date().toISOString(),
          token: this.token
        };
        this.logger.debug("Sending connect data:", connectData);
        ws.send(`40${JSON.stringify(connectData)}`);

        // Set up subscription og read flyttes til etter vi mottar connect_error eller connect
        
        // Keep the connection alive with ping messages
        setInterval(() => {
          this.logger.debug("Sending ping");
          ws.send('3');
        }, 5000);
      });

      ws.on('error', (err: any) => {
        this.logger.error('WebSocket Error:', {
          message: err.message,
          code: err.code,
          error: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      });

      ws.on('close', (code: number, reason: Buffer) => {
        this.logger.error('WebSocket Closed:', {
          code,
          reason: reason.toString(),
          timestamp: new Date().toISOString()
        });

        // Reconnect
        setTimeout(() => {
          this.connect(deviceId);
        }, 500);
      });

      ws.on(
        'message', () => {
          this.logger.debug("Received message")
        }
      )

      ws.on(
        'message',
        (data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => {
          let value = data.toString();
          console.log("Received raw message:", value);

          // Håndter Socket.IO v4 handshake
          if (value.startsWith('0')) {
            try {
              const handshakeData = JSON.parse(value.substring(1));
              console.log("Handshake data:", handshakeData);
              
              // Send connect packet
              const connectData = {
                deviceid: deviceId,
                date: new Date().toISOString(),
                token: this.token
              };
              ws.send(`40${JSON.stringify(connectData)}`);
              return;
            } catch (err) {
              this.logger.error('Failed to parse handshake data:', err);
            }
          }

          // Håndter heartbeat
          if (value === '2') {
            this.logger.debug('Received heartbeat');
            ws.send('3');  // Send heartbeat response
            return;
          }

          // Håndter error meldinger
          if (value.startsWith('44')) {
            this.logger.error('Received error:', value);
            return;
          }

          // Send read og subscribe etter vellykket tilkobling
          if (value.startsWith('42')) {
            try {
              const messageData = JSON.parse(value.substring(2));
              if (messageData[1] && messageData[1].includes('device_connected')) {
                // Set up subscription og read
                const subscription = [
                  "message",
                  JSON.stringify(SwegonConstants.SubscriptionArgs)
                ];

                const read = [
                  "message",
                  JSON.stringify(SwegonConstants.ReadArgs)
                ];

                ws.send(`42${JSON.stringify(read)}`);
                this.logger.debug("Sent read");
                ws.send(`42${JSON.stringify(subscription)}`);
                this.logger.debug("Sent subscription");
              } else {
                // Parse verdimeldinger
                const messageContent = JSON.parse(messageData[1]);
                this.logger.debug('Parsed message content:', messageContent);

                if (messageContent.method === 'value' && messageContent.params?.objects) {
                  messageContent.params.objects.forEach((obj: any) => {
                    this.logger.debug('Received value for object:', {
                      id: obj.id,
                      properties: obj.properties
                    });

                    const measurementValue = obj.properties[SwegonPropertyType.Measurement]?.value || '0';
                    
                    switch (obj.id) {
                      case SwegonObjectId.SupplyTemperature:
                        this.eventHandler.emit('measurement', {
                          type: MeasurementType.SupplyTemperature,
                          value: parseFloat(measurementValue),
                        });
                        break;
                      case SwegonObjectId.OutputTemperature:
                        this.eventHandler.emit('measurement', {
                          type: MeasurementType.ReturnTemperature,
                          value: parseFloat(measurementValue),
                        });
                        break;
                      case SwegonObjectId.IntakeTemperature:
                        this.eventHandler.emit('measurement', {
                          type: MeasurementType.IntakeTemperature,
                          value: parseFloat(measurementValue),
                        });
                        break;
                      case SwegonObjectId.Humidity:
                        this.eventHandler.emit('measurement', {
                          type: MeasurementType.HumidityPercent,
                          value: parseFloat(measurementValue),
                        });
                        break;
                      case SwegonObjectId.HumidityAmount:
                        this.eventHandler.emit('measurement', {
                          type: MeasurementType.HumidityAmount,
                          value: parseFloat(measurementValue) / 10,
                        });
                        break;
                      case SwegonObjectId.CurrentFanSpeed:
                        this.eventHandler.emit('measurement', {
                          type: MeasurementType.CurrentFanSpeed,
                          value: parseInt(measurementValue, 10),
                        });
                        break;
                      case SwegonObjectId.VentilationLevelIn:
                        this.eventHandler.emit('measurement', {
                          type: MeasurementType.VentilationLevelIn,
                          value: parseInt(measurementValue, 10),
                        });
                        break;
                      case SwegonObjectId.VentilationLevelOut:
                        this.eventHandler.emit('measurement', {
                          type: MeasurementType.VentilationLevelOut,
                          value: parseInt(measurementValue, 10),
                        });
                        break;
                      case SwegonObjectId.BoostCountDown:
                        this.eventHandler.emit('measurement', {
                          type: MeasurementType.BoostCountDown,
                          value: parseInt(measurementValue, 10),
                        });
                        break;
                      case SwegonObjectId.SetFanSpeed:
                        this.eventHandler.emit('mode', {
                          id: ModeType.ClimateMode,
                          value: measurementValue,
                        });
                        break;
                      case SwegonObjectId.SummerNightCoolingBoost:
                        this.eventHandler.emit('setting', {
                          id: SettingType.SummerNightCoolingBoost,
                          value: measurementValue,
                        });
                        break;
                      case SwegonObjectId.SummerNightCoolingMode:
                        this.eventHandler.emit('mode', {
                          id: ModeType.SummerNightCoolingMode,
                          value: parseInt(measurementValue, 10),
                        });
                        break;
                      case SwegonObjectId.TemperatureControlMode:
                        this.eventHandler.emit('setting', {
                          id: SettingType.TemperatureControlMode,
                          value: measurementValue,
                        });
                        break;
                      case SwegonObjectId.AutoHumidityControlMode:
                        this.eventHandler.emit('mode', {
                          id: ModeType.AutoHumidityControlMode,
                          value: parseInt(measurementValue, 10),
                        });
                        break;
                      case SwegonObjectId.AutoHumidityControlBoostLimit:
                        this.eventHandler.emit('setting', {
                          id: SettingType.AutoHumidityControlBoostLimit,
                          value: parseInt(measurementValue, 10),
                        });
                        break;
                      case SwegonObjectId.AutoHumidityControlFullBoostLimit:
                        this.eventHandler.emit('setting', {
                          id: SettingType.AutoHumidityControlFullBoostLimit,
                          value: parseInt(measurementValue, 10),
                        });
                        break;
                      case SwegonObjectId.TravellingModeTemperatureDrop:
                        this.eventHandler.emit('setting', {
                          id: SettingType.TravellingModeTemperatureDrop,
                          value: parseInt(measurementValue, 10),
                        });
                        break;
                      case SwegonObjectId.AwayModeTemperatureDrop:
                        this.eventHandler.emit('setting', {
                          id: SettingType.AwayModeTemperatureDrop,
                          value: parseInt(measurementValue, 10),
                        });
                        break;
                      case SwegonObjectId.SupplyTemperatureSetpoint:
                        this.eventHandler.emit('setting', {
                          id: SettingType.SupplyTemperatureSetpoint,
                          value: parseInt(measurementValue, 10),
                        });
                        break;
                      default:
                        break;
                    }
                  });
                }
              }
            } catch (parseErr) {
              this.logger.error('Unable to parse Swegon message', parseErr);
            }
          }

          this.logger.debug('Received message from Swegon', value);

          if (value.startsWith('42')) {
            value = value.substring(2);

            try {
              const message = JSON.parse(value) as SwegonBaseMessage;

              if (message?.method === 'value') {
                const messageContent = (
                  message as SwegonMeasurementMessage
                ).params?.objects?.find(
                  (x) => x.properties[SwegonPropertyType.Measurement] != null,
                );
                const measurementValue =
                  messageContent?.properties[SwegonPropertyType.Measurement]
                    ?.value || '0';

                switch (messageContent?.id) {
                  case SwegonObjectId.SupplyTemperature:
                    this.eventHandler.emit('measurement', {
                      type: MeasurementType.SupplyTemperature,
                      value: parseFloat(measurementValue),
                    });
                    break;
                  case SwegonObjectId.OutputTemperature:
                    this.eventHandler.emit('measurement', {
                      type: MeasurementType.ReturnTemperature,
                      value: parseFloat(measurementValue),
                    });
                    break;
                  case SwegonObjectId.IntakeTemperature:
                    this.eventHandler.emit('measurement', {
                      type: MeasurementType.IntakeTemperature,
                      value: parseFloat(measurementValue),
                    });
                    break;
                  case SwegonObjectId.Humidity:
                    this.eventHandler.emit('measurement', {
                      type: MeasurementType.HumidityPercent,
                      value: parseFloat(measurementValue),
                    });
                    break;
                  case SwegonObjectId.HumidityAmount:
                    this.eventHandler.emit('measurement', {
                      type: MeasurementType.HumidityAmount,
                      value: parseFloat(measurementValue) / 10,
                    });
                    break;
                  case SwegonObjectId.CurrentFanSpeed:
                    this.eventHandler.emit('measurement', {
                      type: MeasurementType.CurrentFanSpeed,
                      value: parseInt(measurementValue, 10),
                    });
                    break;
                  case SwegonObjectId.VentilationLevelIn:
                    this.eventHandler.emit('measurement', {
                      type: MeasurementType.VentilationLevelIn,
                      value: parseInt(measurementValue, 10),
                    });
                    break;
                  case SwegonObjectId.VentilationLevelOut:
                    this.eventHandler.emit('measurement', {
                      type: MeasurementType.VentilationLevelOut,
                      value: parseInt(measurementValue, 10),
                    });
                    break;
                  case SwegonObjectId.BoostCountDown:
                    this.eventHandler.emit('measurement', {
                      type: MeasurementType.BoostCountDown,
                      value: parseInt(measurementValue, 10),
                    });
                    break;
                  case SwegonObjectId.SetFanSpeed:
                    this.eventHandler.emit('mode', {
                      id: ModeType.ClimateMode,
                      value: measurementValue,
                    });
                    break;
                  case SwegonObjectId.SummerNightCoolingBoost:
                    this.eventHandler.emit('setting', {
                      id: SettingType.SummerNightCoolingBoost,
                      value: measurementValue,
                    });
                    break;
                  case SwegonObjectId.SummerNightCoolingMode:
                    this.eventHandler.emit('mode', {
                      id: ModeType.SummerNightCoolingMode,
                      value: parseInt(measurementValue, 10),
                    });
                    break;
                  case SwegonObjectId.TemperatureControlMode:
                    this.eventHandler.emit('setting', {
                      id: SettingType.TemperatureControlMode,
                      value: measurementValue,
                    });
                    break;
                  case SwegonObjectId.AutoHumidityControlMode:
                    this.eventHandler.emit('mode', {
                      id: ModeType.AutoHumidityControlMode,
                      value: parseInt(measurementValue, 10),
                    });
                    break;
                  case SwegonObjectId.AutoHumidityControlBoostLimit:
                    this.eventHandler.emit('setting', {
                      id: SettingType.AutoHumidityControlBoostLimit,
                      value: parseInt(measurementValue, 10),
                    });
                    break;
                  case SwegonObjectId.AutoHumidityControlFullBoostLimit:
                    this.eventHandler.emit('setting', {
                      id: SettingType.AutoHumidityControlFullBoostLimit,
                      value: parseInt(measurementValue, 10),
                    });
                    break;
                  case SwegonObjectId.TravellingModeTemperatureDrop:
                    this.eventHandler.emit('setting', {
                      id: SettingType.TravellingModeTemperatureDrop,
                      value: parseInt(measurementValue, 10),
                    });
                    break;
                  case SwegonObjectId.AwayModeTemperatureDrop:
                    this.eventHandler.emit('setting', {
                      id: SettingType.AwayModeTemperatureDrop,
                      value: parseInt(measurementValue, 10),
                    });
                    break;
                  case SwegonObjectId.SupplyTemperatureSetpoint:
                    this.eventHandler.emit('setting', {
                      id: SettingType.SupplyTemperatureSetpoint,
                      value: parseInt(measurementValue, 10),
                    });
                    break;
                  default:
                    break;
                }
              } else if (message?.method === 'device_connected') {
                const messageContent = (message as SwegonConnectionMessage)
                  .params;

                this.eventHandler.emit('connectionInfo', {
                  id: messageContent?.id,
                  deviceName: messageContent?.devicename,
                  serialNumber: messageContent?.serialnumber,
                } as ConnectionInfo);
              } else if (
                message?.result &&
                (message as SwegonDeviceMessage).result.objects &&
                (message as SwegonDeviceMessage).result.objects.length > 0
              ) {
                const messageContent = (message as SwegonDeviceMessage).result
                  .objects[0];

                this.eventHandler.emit('deviceInfo', {
                  serialNumber:
                    messageContent?.properties[SwegonPropertyType.ClimateMode]
                      ?.value,
                } as DeviceInfo);
              }
            } catch (parseErr) {
              this.logger.error('Unable to parse Swegon message', parseErr);
            }
          }
        },
      );

      this.ws = ws;
    } catch (err) {
      this.logger.error(err);
    }
  }

  public async login(): Promise<SwegonLoginResult | null> {
    try {
      const result = await axios.post<SwegonLoginResult>(
        'https://api.ouman.io/login',
        {
          type: 'client',
          tag: 'ouman/swegon',
          username: this.username,
          password: this.password,
        },
        {
          headers: {
            Origin: SwegonCasaOrigin,
          },
        },
      );

      if (result?.data) {
        this.token = result.data.token;

        return result.data;
      }
    } catch (err) {
      this.logger.error(err);
    }

    return null;
  }

  public async getDevices(): Promise<SwegonDevice[] | []> {
    try {
      const result = await this.login();

      return result?.devices || [];
    } catch (err) {
      this.logger.error(err);

      return [];
    }
  }

  public async destroy(): Promise<void> {
    this.ws?.close();
  }
}

export default SwegonClient;
