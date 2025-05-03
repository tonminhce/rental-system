export default () => ({
  NODE_ENV: process.env.NODE_ENV || 'production',

  APP_NAME: process.env.npm_package_name || 'grab-app',
  APP_DESCRIPTION: process.env.npm_package_description || 'grab-app',
  APP_VERSION: process.env.npm_package_version || 'grab-app',

  APP_PORT: parseInt(process.env.APP_PORT, 10) || 8080,
  APP_PREFIX: process.env.APP_PREFIX || 'api',

  DB_PORT: process.env.DB_PORT || 3306,
  DB_HOST_READ: process.env.DB_HOST_READ || '127.0.0.1',
  DB_HOST_WRITE: process.env.DB_HOST_WRITE || '127.0.0.1',
  DB_USER: process.env.DB_USER || 'grab_user',
  DB_PASSWORD: process.env.DB_PASSWORD || 'grab_pwd',
  DB_NAME: process.env.DB_NAME || 'grab_mysql',

  SWAGGER_PATH: 'document',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:4000',

  // JWT Configuration
  TOKEN_SECRET: process.env.TOKEN_SECRET || '1qazXSW@',
  TOKEN_EXPIRATION: process.env.TOKEN_EXPIRATION || '1h',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || '1qazXSW@',
  REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
});
