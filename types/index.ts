import MeasurementType from '../lib/MeasurementType';
import ModeType from '../lib/ModeType';

export type Measurement = {
  type: MeasurementType;
  value: any;
};

export type Mode = {
  id: ModeType;
  value: any;
};

export type ConnectionInfo = {
  id: string;
  deviceName: string;
  serialNumber: string;
};

export type DeviceInfo = {
  serialNumber: string;
};
