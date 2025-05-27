// ~/config/index.ts
import { merge } from "lodash";
import { IConfig } from "./types";
import defaultConfig from "./default";
import developmentConfig from "./development";
import productionConfig from "./production";
import dotenv from "dotenv";
import path from "path";

// Load env file trước khi load config
dotenv.config({
  path: path.resolve(
    process.cwd(),
    process.env.NODE_ENV === "test" ? ".env.test" : ".env"
  ),
});

export class ConfigLoader {
  private static validate(config: IConfig): void {
    if (!config.database.uri) {
      throw new Error("Database URI is required");
    }

    if (config.app.env === "production" && config.app.debug) {
      throw new Error("Debug mode cannot be enabled in production");
    }
  }

  public static load(): IConfig {
    const env = process.env.NODE_ENV || "development";

    const environmentConfig =
      env === "production" ? productionConfig : developmentConfig;

    const mergedConfig = merge({}, defaultConfig, environmentConfig, {
      app: { env },
    }) as IConfig;

    this.validate(mergedConfig);

    return mergedConfig;
  }
}

export const config = ConfigLoader.load();
