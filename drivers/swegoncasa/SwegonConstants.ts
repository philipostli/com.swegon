import { SwegonMeasurementMessage } from '../../types/swegon';
import SwegonObjectId from '../../lib/SwegonObjectId';

const WriteArgs = (id: string, value: number): any => {
  return {
    jsonrpc: '2.0',
    id: 5,
    method: 'write',
    params: {
      objects: [
        {
          id,
          device: '255',
          properties: {
            '85': {
              value,
            },
          },
        },
      ],
    },
  };
};

const ReadArgs: SwegonMeasurementMessage = {
  jsonrpc: '2.0',
  id: 1,
  method: 'read',
  params: {
    objects: [
      {
        id: SwegonObjectId.Device,
        device: '255',
        properties: {
          '948': {},
        },
      },
    ],
  },
};

const SubscriptionArgs: SwegonMeasurementMessage = {
  jsonrpc: '2.0',
  id: 2,
  method: 'subscribe',
  params: {
    objects: [
      {
        id: SwegonObjectId.SupplyTemperature,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.OutputTemperature,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.IntakeTemperature,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: '21',
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.Humidity,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.HumidityAmount,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: '25',
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.CurrentFanSpeed,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.VentilationLevelIn,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.VentilationLevelOut,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.BoostCountDown,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: '81',
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.SetFanSpeed,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.TravellingModeTemperatureDrop,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.AutoHumidityControlBoostLimit,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.AutoHumidityControlFullBoostLimit,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: '131',
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.AutoHumidityControlMode,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.SummerNightCoolingBoost,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.SummerNightCoolingMode,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.SupplyTemperatureSetpoint,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.TemperatureControlMode,
        device: '255',
        properties: {
          '85': {},
        },
      },
      {
        id: SwegonObjectId.AwayModeTemperatureDrop,
        device: '255',
        properties: {
          '85': {},
        },
      },
    ],
  },
};

export default { SubscriptionArgs, ReadArgs, WriteArgs };
