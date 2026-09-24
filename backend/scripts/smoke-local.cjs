require('dotenv').config();
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const { randomUUID } = require('node:crypto');
const origin = 'http://127.0.0.1:8100/api';
async function main() {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.DB_NAME !== 'rentalk_local'
  )
    throw new Error('Smoke tests only run against rentalk_local');
  const email = `smoke-${randomUUID()}@example.invalid`;
  const password = `Test-${randomUUID()}!`;
  const db = await mysql.createConnection({
    host: process.env.DB_HOST_WRITE,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  async function request(path, method = 'GET', body, token) {
    const res = await fetch(origin + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    // HTTP status must win: bodies can carry their own `status` field
    // (e.g. /health returns {"status":"ok"}), which would clobber it.
    return { ...(await res.json()), status: res.status };
  }
  try {
    assert.equal((await request('/health')).status, 200);
    const listings = await request('/posts?limit=4&transactionType=rent');
    assert.equal(listings.data.data.length, 4);
    const homes = await request(
      '/posts?district=' +
        encodeURIComponent('Bình Thạnh') +
        '&maxPrice=15&propertyType=apartment',
    );
    assert.ok(
      homes.data.data.every(
        (p) => p.district === 'Bình Thạnh' && Number(p.price) <= 15,
      ),
    );
    const nearby = await request(
      '/posts?centerLat=10.7945&centerLng=106.7218&radius=0.1',
    );
    assert.equal(nearby.data.data.length, 1);
    assert.equal((await request('/posts?centerLat=1000')).status, 400);
    assert.equal((await request('/posts?page=1.5')).status, 400);
    assert.equal(
      (await request('/posts?propertyType=apartment,room')).status,
      200,
    );
    const id = listings.data.data[0].id;
    assert.equal((await request(`/posts/${id}`)).status, 200);
    assert.equal(
      (await request(`/posts/${id}/favourites`, 'POST')).status,
      401,
    );
    const signup = await request('/auth/signup', 'POST', {
      name: 'Local smoke test',
      email,
      password,
      role: 'user',
    });
    assert.equal(signup.status, 201);
    const token = signup.data.token;
    assert.ok(token);
    const [rows] = await db.execute(
      'SELECT password FROM users WHERE email = ?',
      [email],
    );
    assert.ok(rows[0].password.startsWith('scrypt:'));
    const login = await request('/auth/login', 'POST', { email, password });
    assert.equal(login.status, 200);
    const sessionToken = login.data.token;
    const meBefore = await request(
      '/roommate/profile/me',
      'GET',
      undefined,
      sessionToken,
    );
    assert.equal(meBefore.status, 200);
    assert.equal(meBefore.data.profile, null);
    const suggestions = await request(
      '/roommate/suggestions',
      'GET',
      undefined,
      sessionToken,
    );
    assert.equal(suggestions.status, 200);
    assert.deepEqual(suggestions.data.suggestions, []);
    const profile = {
      gender: 'Male',
      lifestyle: 'Clean',
      pets: false,
      smoking: false,
      personality: 'Introvert',
      age: 25,
      wakeUpTime: '07:00',
      bedTime: '23:00',
    };
    assert.equal(
      (await request('/roommate', 'POST', profile, sessionToken)).status,
      201,
    );
    assert.equal(
      (await request('/roommate/profile/me', 'GET', undefined, sessionToken))
        .data.profile.age,
      25,
    );
    assert.equal(
      (
        await request(
          '/roommate',
          'POST',
          { ...profile, age: 26 },
          sessionToken,
        )
      ).status,
      201,
    );
    assert.equal(
      (await request('/roommate/profile/me', 'GET', undefined, sessionToken))
        .data.profile.age,
      26,
    );
    const directory = await request('/roommate');
    assert.equal(directory.status, 200);
    assert.ok(
      directory.data.profiles.every(
        (p) => !('email' in (p.user || {})) && !('phone' in (p.user || {})),
      ),
    );
    assert.equal(
      (
        await request(
          `/posts/${id}/favourites`,
          'POST',
          undefined,
          sessionToken,
        )
      ).status,
      201,
    );
    const detail = await request(
      `/posts/${id}`,
      'GET',
      undefined,
      sessionToken,
    );
    assert.equal(detail.data.post.isFavourite, true);
    assert.equal(
      (
        await request(
          `/posts/${id}/favourites`,
          'DELETE',
          undefined,
          sessionToken,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await request('/auth/refresh-token', 'POST', {
          refreshToken: login.data.refreshToken,
        })
      ).status,
      200,
    );
    console.log(
      'PASS: health, listings, filters, geography, validation, registration, passwords, login, favorites, refresh, roommate onboarding/upsert/suggestions, and public-directory contact privacy.',
    );
  } finally {
    // Only this run's disposable account is removed; foreign keys clean its test favorites/tokens.
    await db.execute('DELETE FROM users WHERE email = ?', [email]);
    await db.end();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
