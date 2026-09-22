/* Seed-time password helper, shared by scripts/seed-local.cjs and the
   sequelize seeders. The format must stay compatible with password.util.ts;
   seedPassword.spec.ts proves that by round-tripping through verifyPassword. */
const { randomBytes, scrypt: scryptCallback } = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(scryptCallback);

async function hashSeedPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${hash.toString('hex')}`;
}

/* A fixed demo password is only safe while it never leaves a developer's
   machine, so callers supply it instead of embedding it. Without one, each
   seed run mints its own and reports it, rather than falling back to a
   guessable constant that ends up in a public repository. */
function resolveSeedPassword(env = process.env) {
  if (env.SEED_DEMO_PASSWORD) {
    return { password: env.SEED_DEMO_PASSWORD, generated: false };
  }
  return { password: randomBytes(9).toString('base64url'), generated: true };
}

module.exports = { hashSeedPassword, resolveSeedPassword };
