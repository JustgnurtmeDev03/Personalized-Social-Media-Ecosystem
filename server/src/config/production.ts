// ~/config/production.ts
import { DeepPartial, IConfig } from "./types";
import defaultConfig from "./default";

const productionConfig: DeepPartial<IConfig> = {
  app: {
    debug: false,
    name: `${defaultConfig.app.name} (Prod)`,
  },
  database: {
    uri: process.env.DATABASE_URI!, // Ép kiểu non-null
    poolSize: 50,
  },
  logger: {
    level: "error",
    format: "json",
  },
};

export default productionConfig;
