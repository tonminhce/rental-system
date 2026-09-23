'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // get user id from 'users'
    const user1 = await queryInterface.rawSelect('users', {
      where: { email: 'mogi@gmail.com' }
    }, ['id']); // get user id by email 'mogi@gmail.com'

    const user2 = await queryInterface.rawSelect('users', {
      where: { email: 'user@example.com' }
    }, ['id']); // get user id by email 'user@example.com'

    const user3 = await queryInterface.rawSelect('users', {
      where: { email: 'owner@example.com' }
    }, ['id']); // get user id by email 'owner@example.com'

    const user4 = await queryInterface.rawSelect('users', {
      where: { email: 'qa@gmail.com' }
    }, ['id']); // get user id by email 'qa@gmail.com'

    // data for 'user_profiles'
    // ignoreDuplicates: user_profiles.user_id is UNIQUE, so repeat boots no-op.
    return queryInterface.bulkInsert('user_profiles', [
      {
        user_id: user1,  // get user_id from email
        gender: 'Male',
        lifestyle: 'Clean',
        pets: true,
        smoking: false,
        personality: 'Introvert',
        age: 25,
        wake_up_time: '07:00',
        bed_time: '22:00',
        total_score: 9,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: user2,
        gender: 'Female',
        lifestyle: 'Normal',
        pets: false,
        smoking: true,
        personality: 'Extrovert',
        age: 30,
        wake_up_time: '06:30',
        bed_time: '23:00',
        total_score: 5,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: user3,
        gender: 'Male',
        lifestyle: 'Messy',
        pets: true,
        smoking: true,
        personality: 'Extrovert',
        age: 40,
        wake_up_time: '08:00',
        bed_time: '00:00',
        total_score: 7,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_id: user4,
        gender: 'Male',
        lifestyle: 'Normal',
        pets: false,
        smoking: false,
        personality: 'Introvert',
        age: 22,
        wake_up_time: '07:30',
        bed_time: '23:30',
        total_score: 6,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    // Only profiles belonging to the seeded demo accounts.
    const demoUsers = await queryInterface.select(null, 'users', {
      attributes: ['id'],
      where: {
        email: {
          [Sequelize.Op.in]: [
            'mogi@gmail.com',
            'user@example.com',
            'owner@example.com',
            'qa@gmail.com',
          ],
        },
      },
    });
    const ids = demoUsers.map((user) => user.id);
    if (ids.length === 0) return;
    return queryInterface.bulkDelete('user_profiles', {
      user_id: { [Sequelize.Op.in]: ids },
    }, {});
  },
};
