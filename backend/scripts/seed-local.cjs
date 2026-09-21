/* Explicit, idempotent local-only preview data. Never run against production. */
require('dotenv').config();
const mysql = require('mysql2/promise');
async function seed() {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.DB_NAME !== 'rentalk_local'
  )
    throw new Error('Seeding is restricted to rentalk_local.');
  const db = await mysql.createConnection({
    host: process.env.DB_HOST_WRITE,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const homes = [
    [
      'The light-filled apartment',
      'Thủ Đức',
      'Thảo Điền',
      18,
      72,
      2,
      10.8046,
      106.7331,
      'apartment',
      'photo-1600210492486-724fe5c67fb0',
    ],
    [
      'A quiet corner in Bình Thạnh',
      'Bình Thạnh',
      'Phường 22',
      12,
      55,
      1,
      10.7945,
      106.7218,
      'apartment',
      'photo-1600607687920-4e2a09cf159d',
    ],
    [
      'Your city-center retreat',
      'Quận 1',
      'Bến Nghé',
      15,
      48,
      1,
      10.7763,
      106.7009,
      'apartment',
      'photo-1600566753086-00f18fb6b3ea',
    ],
    [
      'A little room to unwind',
      'Quận 3',
      'Phường 7',
      5,
      30,
      1,
      10.7821,
      106.6867,
      'room',
      'photo-1616486338812-3dadae4b4ace',
    ],
    [
      'Garden house in Thảo Điền',
      'Thủ Đức',
      'Thảo Điền',
      28,
      140,
      3,
      10.8084,
      106.7319,
      'house',
      'photo-1600210492486-724fe5c67fb0',
    ],
    [
      'Riverside apartment',
      'Quận 7',
      'Tân Phong',
      20,
      85,
      2,
      10.7302,
      106.7092,
      'apartment',
      'photo-1600607687920-4e2a09cf159d',
    ],
  ];
  for (const [index, home] of homes.entries()) {
    const [name, district, ward, price, area, bedrooms, lat, lng, type, photo] =
      home;
    const source = `rentalk-demo:${index + 1}`;
    const [exists] = await db.execute(
      'SELECT id FROM rental_posts WHERE source_url = ?',
      [source],
    );
    if (exists.length) continue;
    const [result] = await db.execute(
      'INSERT INTO rental_posts (name, description, price, area, property_type, transaction_type, province, district, ward, latitude, longitude, displayed_address, status, bedrooms, bathrooms, source_url, contact_name, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,DATE_SUB(NOW(), INTERVAL ? MINUTE),NOW())',
      [
        name,
        'Sample listing for the renTalk local preview. Photos are illustrative; this is not a verified property or an offer to rent. Explore filters, map locations, and saved homes with this demonstration.',
        price,
        area,
        type,
        'rent',
        'Ho Chi Minh City',
        district,
        ward,
        lat,
        lng,
        `${ward}, ${district}, Ho Chi Minh City`,
        'active',
        bedrooms,
        Math.max(1, bedrooms - 1),
        source,
        'Preview listing — no real owner',
        index,
      ],
    );
    await db.execute(
      'INSERT INTO rental_images (rental_id, url, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [
        result.insertId,
        `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=800&q=80`,
      ],
    );
  }
  console.log(
    'Local sample homes are ready (6 listings; no existing data overwritten).',
  );

  const demoUsers = [
    {
      name: 'Linh Nguyen',
      email: 'linh.nguyen@example.com',
      phone: '0901234567',
      password: '***REDACTED***',
      gender: 'Female',
      lifestyle: 'Clean',
      pets: false,
      smoking: false,
      personality: 'Introvert',
      age: 24,
      wakeUp: '06:30',
      bedTime: '22:30',
      score: 6, // clean(3)+introvert(3)+pets(0)+smoking(0)+female(0)
    },
    {
      name: 'Minh Tran',
      email: 'minh.tran@example.com',
      phone: '0912345678',
      password: '***REDACTED***',
      gender: 'Male',
      lifestyle: 'Clean',
      pets: true,
      smoking: false,
      personality: 'Extrovert',
      age: 26,
      wakeUp: '07:00',
      bedTime: '23:00',
      score: 8, // male(1)+clean(3)+extrovert(2)+pets(2)+smoking(0)
    },
    {
      name: 'An Vo',
      email: 'an.vo@example.com',
      phone: '0923456789',
      password: '***REDACTED***',
      gender: 'Female',
      lifestyle: 'Normal',
      pets: true,
      smoking: false,
      personality: 'Introvert',
      age: 22,
      wakeUp: '07:30',
      bedTime: '23:30',
      score: 7, // female(0)+normal(2)+introvert(3)+pets(2)+smoking(0)
    },
    {
      name: 'Huy Dang',
      email: 'huy.dang@example.com',
      phone: '0934567890',
      password: '***REDACTED***',
      gender: 'Male',
      lifestyle: 'Normal',
      pets: false,
      smoking: false,
      personality: 'Extrovert',
      age: 28,
      wakeUp: '06:00',
      bedTime: '22:00',
      score: 5, // male(1)+normal(2)+extrovert(2)+pets(0)+smoking(0)
    },
    {
      name: 'Mai Le',
      email: 'mai.le@example.com',
      phone: '0945678901',
      password: '***REDACTED***',
      gender: 'Female',
      lifestyle: 'Clean',
      pets: false,
      smoking: false,
      personality: 'Introvert',
      age: 25,
      wakeUp: '07:00',
      bedTime: '23:00',
      score: 6, // female(0)+clean(3)+introvert(3)+pets(0)+smoking(0)
    },
    {
      name: 'Duc Pham',
      email: 'duc.pham@example.com',
      phone: '0956789012',
      password: '***REDACTED***',
      gender: 'Male',
      lifestyle: 'Normal',
      pets: true,
      smoking: false,
      personality: 'Extrovert',
      age: 27,
      wakeUp: '08:00',
      bedTime: '00:00',
      score: 7, // male(1)+normal(2)+extrovert(2)+pets(2)+smoking(0)
    },
  ];

  for (const u of demoUsers) {
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [u.email]);
    let userId;
    if (existing.length) {
      userId = existing[0].id;
    } else {
      const [userRes] = await db.execute(
        'INSERT INTO users (name, email, phone, password, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, 1, NOW(), NOW())',
        [u.name, u.email, u.phone, u.password],
      );
      userId = userRes.insertId;
    }

    const [profileExists] = await db.execute('SELECT id FROM user_profiles WHERE user_id = ?', [userId]);
    if (!profileExists.length) {
      await db.execute(
        'INSERT INTO user_profiles (user_id, gender, lifestyle, pets, smoking, personality, age, wake_up_time, bed_time, total_score, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [userId, u.gender, u.lifestyle, u.pets ? 1 : 0, u.smoking ? 1 : 0, u.personality, u.age, u.wakeUp, u.bedTime, u.score],
      );
    }
  }

  // Also ensure user with id 5 (tonminhwork@gmail.com) has a default profile if none exists
  const [targetUser] = await db.execute('SELECT id FROM users WHERE email = ?', ['tonminhwork@gmail.com']);
  if (targetUser.length) {
    const tUserId = targetUser[0].id;
    const [tProfile] = await db.execute('SELECT id FROM user_profiles WHERE user_id = ?', [tUserId]);
    if (!tProfile.length) {
      await db.execute(
        'INSERT INTO user_profiles (user_id, gender, lifestyle, pets, smoking, personality, age, wake_up_time, bed_time, total_score, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [tUserId, 'Male', 'Clean', 1, 0, 'Introvert', 25, '07:00', '23:00', 9],
      );
    }
  }

  console.log('Local sample roommate profiles are ready.');
  await db.end();
}
seed().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
