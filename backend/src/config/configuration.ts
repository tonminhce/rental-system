// Fail-closed secret validation: runs in EVERY environment (compose pinned
// NODE_ENV=local, so a production-only guard in main.ts is bypassable).
for (const name of ['TOKEN_SECRET', 'REFRESH_TOKEN_SECRET']) {
  if (!process.env[name]) {
    throw new Error(
      `${name} is required — the app refuses to boot without it. Generate one with: openssl rand -hex 32`,
    );
  }
}
if (process.env.TOKEN_SECRET === process.env.REFRESH_TOKEN_SECRET) {
  throw new Error(
    'TOKEN_SECRET and REFRESH_TOKEN_SECRET must be different keys',
  );
}

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
  DB_PASSWORD: process.env.DB_PASSWORD || '***REDACTED***',
  DB_NAME: process.env.DB_NAME || 'grab_mysql',

  SWAGGER_PATH: 'document',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:4000',

  // JWT Configuration (secrets validated above — never defaulted)
  TOKEN_SECRET: process.env.TOKEN_SECRET,
  TOKEN_EXPIRATION: process.env.TOKEN_EXPIRATION || '1h',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
});
