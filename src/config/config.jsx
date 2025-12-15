const config = {
  development: {
    API_BASE_URL:
      import.meta.env.REACT_APP_API_URL ||
      "https://leave-management-system--dcd.fly.dev",
    APP_ENV: "development",
  },
  production: {
    API_BASE_URL:
      import.meta.env.REACT_APP_API_URL ||
      "https://leave-management-system--dcd.fly.dev",
    APP_ENV: "production",
  },
  staging: {
    API_BASE_URL:
      import.meta.env.REACT_APP_API_URL || "https://staging-api.com",
    APP_ENV: "staging",
  },
};

const environment = process.env.NODE_ENV || "development";
const currentConfig = config[environment];

export default currentConfig;
export const API_BASE_URL = currentConfig.API_BASE_URL;
export const APP_ENV = currentConfig.APP_ENV;
