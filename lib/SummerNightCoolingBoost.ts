import settings from '../drivers/swegoncasa/driver.settings.compose.json';
import Utils from './Utils';

const SummerNightCoolingBoost = Utils.getSetting(
  'summerNightCoolingBoost',
  settings,
);

export default SummerNightCoolingBoost;
