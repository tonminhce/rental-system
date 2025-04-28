export default () => ({
  NODE_ENV: process.env.NODE_ENV || 'production',

  APP_NAME: process.env.npm_package_name || 'grab-app',
  APP_DESCRIPTION: process.env.npm_package_description || 'grab-app',
  APP_VERSION: process.env.npm_package_version || 'grab-app',

  APP_PORT: parseInt(process.env.PORT, 10) || 3000,
  APP_PREFIX: process.env.APP_PREFIX || 'api',

  DB_PORT: process.env.DB_PORT || 3306,
  DB_HOST_READ: process.env.DB_HOST_READ || 'localhost',
  DB_HOST_WRITE: process.env.DB_HOST_WRITE || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || 'root',
  DB_NAME: process.env.DB_NAME || 'grab_mysql',

  SWAGGER_PATH: 'document',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:4000',
});
