'use strict';

const {
  hashSeedPassword,
  resolveSeedPassword,
} = require('../../shared/utils/seedPassword');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     */
    const demo = resolveSeedPassword();
    if (demo.generated) {
      console.log(
        `Demo seed accounts share a generated password: ${demo.password}\n` +
          'Set SEED_DEMO_PASSWORD to pin it across seed runs and for the crawler.',
      );
    }
    // hashSeedPassword salts per call, so the four rows never share a digest.
    const password = await hashSeedPassword(demo.password);

    // ignoreDuplicates: repeated boots must not crash on the unique email.
    return queryInterface.bulkInsert('users', [
      {
        name: 'Mogi Crawler',
        email: 'mogi@gmail.com',
        phone: '1234567890',
        password,
        role_id: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Regular User',
        email: 'user@example.com',
        phone: '0987654321',
        password,
        role_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Property Owner',
        email: 'owner@example.com',
        phone: '1122334455',
        password,
        role_id: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Quoc Anh',
        email: 'qa@gmail.com',
        phone: '1122334455',
        password,
        role_id: 2,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    // Only the rows this seeder created — never the whole users table.
    return queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.in]: [
          'mogi@gmail.com',
          'user@example.com',
          'owner@example.com',
          'qa@gmail.com'
        ]
      }
    }, {});
  }
}; 