import { HomeySetting } from '../types/homey';

const getSetting = (
  id: string,
  settings: HomeySetting[],
): HomeySetting | null => {
  // Find setting in the settings tree
  let setting: HomeySetting | null = null;

  settings.some(function iter(a: HomeySetting) {
    if (a.id === id) {
      setting = a;
      return true;
    }

    return Array.isArray(a.children) && a.children.some(iter);
  });

  return setting;
};

export default { getSetting };
