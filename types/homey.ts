export type HomeyTranslationObject = {
  en: string;
};

export type HomeyEnumValue = {
  id: string;
  value: number;
  title: HomeyTranslationObject;
};

export type SettingsChangedEvent = {
  oldSettings: any;
  newSettings: any;
  changedKeys: any;
};

export type HomeySetting = {
  type: string;
  label: HomeyTranslationObject;
  children?: HomeySetting[];
  values?: HomeySettingValue[];
  id?: string;
  value?: any;
  hint?: HomeyTranslationObject;
};

export type HomeySettingValue = {
  id: string;
  value?: number | string;
  label: HomeyTranslationObject;
};
