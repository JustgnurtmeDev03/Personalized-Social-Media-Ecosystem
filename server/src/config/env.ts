import { cleanEnv, str } from "envalid";

const env = cleanEnv(process.env, {
  JWT_ACCESS_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  JWT_ACCESS_EXPIRATION: str(),
  JWT_REFRESH_EXPIRATION: str(),
  DB_URI: str(),
  EMAIL_USER: str(),
  EMAIL_PASS: str(),
  NODE_ENV: str(),
  LOG_LEVEL: str(),
  APP_URL: str(),
  CLOUDINARY_CLOUD_NAME: str(),
  CLOUDINARY_API_KEY: str(),
  CLOUDINARY_API_SECRET: str(),
});

export default env;
