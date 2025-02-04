export type SwegonDevice = {
  id: string;
  name: string;
  tag: string;
  server: string;
};

export type SwegonLoginResult = {
  acl: {
    devices: {
      view: boolean;
      viewLogs: boolean;
    };
  };
  role: string;
  devices: SwegonDevice[];
  token: string;
  socketServerUrl: string;
  username: string;
};

export type SwegonWebsocketConfig = {
  id: string;
  timeout: number;
  interval: number;
  transports: string[];
};

export type SwegonMeasurementObject = {
  id: string;
  device?: string;
  properties: {
    '85'?: {
      value?: string;
    };
    '662'?: {
      value?: string;
    };
    '948'?: {
      value?: string;
    };
  };
};

export interface SwegonConnectionMessage extends SwegonBaseMessage {
  params: {
    accessip: string;
    applicationversion: string;
    connection: string;
    devicename: string;
    devicetype: string;
    gateway: string;
    hostname: string;
    id: string;
    ip: string;
    ipaddress: string;
    macaddress: string;
    netmask: string;
    port: string;
    serialnumber: string;
    supplier: string;
    swversion: string;
  };
}

export interface SwegonMeasurementMessage extends SwegonBaseMessage {
  params?: {
    objects: SwegonMeasurementObject[];
  };
}

export interface SwegonDeviceMessage extends SwegonBaseMessage {
  result: {
    objects: SwegonDeviceObject[];
  };
}

export type SwegonDeviceObject = {
  id: string;
  device: string;
  properties: {
    '948': {
      value: string;
    };
  };
};

export interface SwegonBaseMessage {
  id?: number;
  jsonrpc: string;
  method?: string;
  result?: any;
}

export enum SwegonClimateMode {
  Away = 1,
  Home = 2,
  Boost = 3,
  Travel = 4,
  Off = 5,
  Fireplace = 6,
}
