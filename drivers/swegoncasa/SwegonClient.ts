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
  private wsSocket: WebSocket | null = null;
  private eventHandler: EventEmitter;
  private logger: Logger;
  private timestamp: Date = new Date();
  private hasInitialized = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(username: string, password: string, logger: Logger) {
    this.username = username;
    this.password = password;
    this.eventHandler = new EventEmitter();
    this.logger = logger;
  }

  public onMode(callback: (data: Mode) => Promise<void>): void {
    this.eventHandler.on('mode', (data) => {
      callback(data).catch((err) => {
        this.logger.error('Error in mode callback', err);
      });
    });
  }

  public onMeasurement(callback: (data: Measurement) => Promise<void>): void {
    this.eventHandler.on('measurement', (data) => {
      callback(data).catch((err) => {
        this.logger.error('Error in measurement callback', err);
      });
    });
  }

  public onDeviceInfo(callback: (data: DeviceInfo) => Promise<void>): void {
    this.eventHandler.on('deviceInfo', (data) => {
      callback(data).catch((err) => {
        this.logger.error('Error in deviceInfo callback', err);
      });
    });
  }

  public onConnectionInfo(
    callback: (data: ConnectionInfo) => Promise<void>,
  ): void {
    this.eventHandler.on('connectionInfo', (data) => {
      callback(data).catch((err) => {
        this.logger.error('Error in connectionInfo callback', err);
      });
    });
  }

  public onSetting(
    callback: (id: string, value: string) => Promise<void>,
  ): void {
    this.eventHandler.on('setting', async ({ id, value }) =>
      callback(id, value),
    );
  }

  private isWsReady(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public async setValue(id: SwegonObjectId, value: number): Promise<void> {
    if (this.isWsReady()) {
      const ws = this.ws!;
      const writeMessage = [
        'message',
        JSON.stringify(SwegonConstants.WriteArgs(id, value)),
      ];

      this.logger.debug('Sending message to Swegon', writeMessage);

      ws.send(`42${JSON.stringify(writeMessage)}`);
    }
  }

  public async setClimateMode(
    currentValue: SwegonClimateMode,
    newValue: SwegonClimateMode,
  ): Promise<void> {
    this.logger.debug('Setting climate mode', { currentValue, newValue });
    if (this.isWsReady() && newValue !== currentValue) {
      const ws = this.ws!;

      if (currentValue === SwegonClimateMode.Travel) {
        const travelMessage = [
          'message',
          JSON.stringify(SwegonConstants.WriteArgs('112', 0)),
        ];

        this.logger.debug('Sending message to Swegon', travelMessage);
        ws.send(`42${JSON.stringify(travelMessage)}`);
      }

      if (currentValue === SwegonClimateMode.Fireplace) {
        const fireplaceMessage = [
          'message',
          JSON.stringify(SwegonConstants.WriteArgs('153', 0)),
        ];
        const fireplaceMessage2 = [
          'message',
          JSON.stringify(SwegonConstants.WriteArgs('154', 0)),
        ];

        this.logger.debug('Sending message to Swegon', fireplaceMessage);
        ws.send(`42${JSON.stringify(fireplaceMessage)}`);
        this.logger.debug('Sending message to Swegon', fireplaceMessage2);
        ws.send(`42${JSON.stringify(fireplaceMessage2)}`);
      }

      if (
        newValue === SwegonClimateMode.Away ||
        newValue === SwegonClimateMode.Home ||
        newValue === SwegonClimateMode.Boost
      ) {
        const fanSpeedMessage = [
          'message',
          JSON.stringify(SwegonConstants.WriteArgs(SwegonObjectId.SetFanSpeed, newValue)),
        ];

        this.logger.info(`Setting Fan Speed to ${newValue}`);
        this.logger.debug('Sending message to Swegon', fanSpeedMessage);

        ws.send(`42${JSON.stringify(fanSpeedMessage)}`);
      }

      if (currentValue === SwegonClimateMode.Off) {
        const onMessage = [
          'message',
          JSON.stringify(SwegonConstants.WriteArgs(SwegonObjectId.TurnOff, 0)),
        ];

        const onMessage2 = [
          'message',
          JSON.stringify(SwegonConstants.WriteArgs('156', 1)),
        ];

        this.logger.debug('Sending message to Swegon', onMessage);
        ws.send(`42${JSON.stringify(onMessage)}`);
        this.logger.debug('Sending message to Swegon', onMessage2);
        ws.send(`42${JSON.stringify(onMessage2)}`);
      }

      if (newValue === SwegonClimateMode.Off) {
        const offMessage = [
          'message',
          JSON.stringify(SwegonConstants.WriteArgs(SwegonObjectId.TurnOff, 1)),
        ];

        this.logger.debug('Turning off', offMessage);
        ws.send(`42${JSON.stringify(offMessage)}`);
      }

      if (newValue === SwegonClimateMode.Boost) {
        const boostMessage = [
          'message',
          JSON.stringify(SwegonConstants.WriteArgs('116', 1)),
        ];

        this.logger.debug('Turning on boost', boostMessage);
        ws.send(`42${JSON.stringify(boostMessage)}`);
      }

      if (newValue === SwegonClimateMode.Fireplace) {
        const fireplaceMessage = [
          'message',
          JSON.stringify(SwegonConstants.WriteArgs('153', 1)),
        ];

        this.logger.debug('Turning on fireplace', fireplaceMessage);
        ws.send(`42${JSON.stringify(fireplaceMessage)}`);
      }

      if (newValue === SwegonClimateMode.Travel) {
        const travelMessage = [
          'message',
          JSON.stringify(SwegonConstants.WriteArgs('112', 1)),
        ];

        const travelMessage2 = [
          'message',
          JSON.stringify(SwegonConstants.WriteArgs('154', 1)),
        ];

        this.logger.debug('Turning on travel', travelMessage);
        ws.send(`42${JSON.stringify(travelMessage)}`);
        this.logger.debug('Turning on travel', travelMessage2);
        ws.send(`42${JSON.stringify(travelMessage2)}`);
      }
    }
  }

  public async connect(deviceId: string): Promise<void> {
    try {
      this.timestamp = new Date();

      const url = 'wss://oulite.ouman.io/socket.io/?EIO=4&transport=websocket';

      this.logger.info(
        `Connecting to websocket - Url: ${url}, Device ID: ${deviceId}`,
      );

      const ws = new WebSocket(url, {
        origin: SwegonCasaOrigin,
      });

      this.wsSocket = ws;

      ws.on('open', () => {
        this.logger.info('WebSocket Connected');
        this.ws = ws;

        // Send connect packet med autentisering
        const connectData = {
          deviceid: deviceId,
          date: new Date().toISOString(),
          token: this.token,
        };
        this.logger.debug('Sending connect data:', connectData);
        ws.send(`40${JSON.stringify(connectData)}`);
        
        // Keep the connection alive with ping messages
        this.pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('3');
            this.logger.debug("Sending ping");
          }
        }, 25000);
      });

      ws.on('error', (err: any) => {
        this.logger.error('WebSocket Error:', {
          message: err.message,
          code: err.code,
          error: JSON.stringify(err, Object.getOwnPropertyNames(err)),
        });
      });

      ws.on('close', (code: number, reason: Buffer) => {
        this.ws = null;
        this.wsSocket = null;
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        this.hasInitialized = false;
        
        this.logger.error('WebSocket Closed:', {
          code,
          reason: reason.toString(),
          timestamp: new Date().toISOString(),
        });

        // Reconnect
        setTimeout(() => {
          this.connect(deviceId).catch((err) => {
            this.logger.error('Failed to reconnect', err);
          });
        }, 500);
      });

      ws.on(
        'message',
        (data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => {
          const value = data.toString();
          this.logger.debug('Received message from Swegon: ', value);

          // Håndter Socket.IO v4 handshake
          if (value.startsWith('0')) {
            try {
              const handshakeData = JSON.parse(value.substring(1));
              this.logger.debug("Handshake data:", handshakeData);
              
              // Send connect packet
              const connectData = {
                deviceid: deviceId,
                date: new Date().toISOString(),
                token: this.token,
              };
              ws.send(`40${JSON.stringify(connectData)}`);
              return;
            } catch (err) {
              this.logger.error('Failed to parse handshake data:', err);
            }
          }

          // Håndter error meldinger
          if (value.startsWith('44')) {
            this.logger.error('Received error:', value);
            return;
          }

          if (value.startsWith('42')) {
            try {

              const messageData = JSON.parse(value.substring(2));
              const message = JSON.parse(messageData[1]);
              // this.logger.debug('Parsed message content:', message);
    
              if (messageData[1] && message?.method === 'device_connected') { 

                // Send read og subscribe etter vellykket tilkobling

                const messageContent = (message as SwegonConnectionMessage).params;

                this.eventHandler.emit('connectionInfo', {
                  id: messageContent?.id,
                  deviceName: messageContent?.devicename,
                  serialNumber: messageContent?.serialnumber,
                } as ConnectionInfo);

                // Set up subscription og read
                if (!this.hasInitialized) {
                  const subscription = [
                    'message',
                    JSON.stringify(SwegonConstants.SubscriptionArgs),
                  ];

                  const read = [
                    'message',
                    JSON.stringify(SwegonConstants.ReadArgs),
                  ];

                  ws.send(`42${JSON.stringify(read)}`);
                  this.logger.debug('Sent read');
                  ws.send(`42${JSON.stringify(subscription)}`);
                  this.logger.debug('Sent subscription');
                  
                  this.hasInitialized = true;
                }

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
                
              } else if (message.method === 'value' && message.params?.objects) {
                // Parse verdimeldinger
                message.params.objects.forEach((obj: any) => {
                  this.logger.debug('Received value for object:', {
                    id: obj.id,
                    properties: obj.properties,
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
                    case SwegonObjectId.CO2:
                      this.eventHandler.emit('measurement', {
                        type: MeasurementType.CO2,
                        value: parseInt(measurementValue, 10),
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
                    case SwegonObjectId.AirQuality:
                      this.eventHandler.emit('measurement', {
                        type: MeasurementType.AirQuality,
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
                    case SwegonObjectId.AutoAirQualityControlMode:
                      this.eventHandler.emit('mode', {
                        id: ModeType.AutoAirQualityControlMode,
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
                    case SwegonObjectId.CO2HomeLimit:
                      this.eventHandler.emit('setting', {
                        id: SettingType.CO2HomeLimit,
                        value: parseInt(measurementValue, 10),
                      });
                      break;
                    case SwegonObjectId.CO2AwayLimit:
                      this.eventHandler.emit('setting', {
                        id: SettingType.CO2AwayLimit,
                        value: parseInt(measurementValue, 10),
                      });
                      break;
                    default:
                      break;
                  }
                });
              }
            } catch (parseErr) {
              this.logger.error('Unable to parse Swegon message', parseErr);
            }
          }
     
        },
      );
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
    this.wsSocket?.close();
    this.ws = null;
    this.wsSocket = null;
  }
}

export default SwegonClient;
