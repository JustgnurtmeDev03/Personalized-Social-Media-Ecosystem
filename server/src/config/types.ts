// ~/config/types.ts
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface AppConfig {
  port: number;
  debug: boolean;
  env: "development" | "production" | "test";
  name: string;
}

export interface DatabaseConfig {
  uri: string;
  poolSize?: number;
  timeout?: number;
}

export interface LoggerConfig {
  level: "error" | "warn" | "info" | "debug";
  format?: "json" | "text";
}

export interface IConfig {
  app: AppConfig;
  database: DatabaseConfig;
  logger: LoggerConfig;
}
