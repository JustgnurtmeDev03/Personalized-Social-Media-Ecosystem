// ~/config/development.ts
import { DeepPartial, IConfig } from "./types";
import defaultConfig from "./default";

const developmentConfig: DeepPartial<IConfig> = {
  app: {
    debug: true,
    name: `${defaultConfig.app.name} (Dev)`,
  },
  database: {
    uri: "mongodb://localhost:27017/dev",
  },
  logger: {
    level: "debug",
    format: "text",
  },
};

export default developmentConfig;
