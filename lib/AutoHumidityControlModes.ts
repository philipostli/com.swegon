import autoHumidityControlModes from '../.homeycompose/capabilities/auto_humidity_control_mode.json';
import { HomeyEnumValue } from '../types/homey';

const AutoHumidityControlModes =
  autoHumidityControlModes.values as HomeyEnumValue[];

export default AutoHumidityControlModes;
