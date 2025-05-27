// ~/config/default.ts
import { IConfig } from "./types";

const getDefaultConfig = (): IConfig => ({
  app: {
    port: Number(process.env.PORT) || 5000,
    debug: false,
    env: (process.env.NODE_ENV as IConfig["app"]["env"]) || "development",
    name: process.env.APP_NAME || "Gens", // <-- Thêm giá trị mặc định
  },
  database: {
    uri:
      process.env.DATABASE_URI ||
      "mongodb+srv://trungthpthy:trungdeptrai123@threads.a8gao0g.mongodb.net/Threads?retryWrites=true&w=majority",
    poolSize: Number(process.env.DB_POOL_SIZE) || 10,
    timeout: Number(process.env.DB_TIMEOUT) || 5000,
  },
  logger: {
    level: (process.env.LOG_LEVEL as IConfig["logger"]["level"]) || "info",
    format: process.env.LOG_FORMAT === "json" ? "json" : "text",
  },
});

export default getDefaultConfig();
