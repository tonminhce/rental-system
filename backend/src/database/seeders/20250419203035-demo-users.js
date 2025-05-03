'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     */
    return queryInterface.bulkInsert('users', [
      {
        name: 'Mogi Crawler',
        email: 'mogi@gmail.com',
        phone: '1234567890',
        password: 'cc0ff50e586cbb7914e2842ba81ff815',
        role_id: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Regular User',
        email: 'user@example.com',
        phone: '0987654321',
        password: 'user123',
        role_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Property Owner',
        email: 'owner@example.com',
        phone: '1122334455',
        password: 'owner123',
        role_id: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Quoc Anh',
        email: 'qa@gmail.com',
        phone: '1122334455',
        password: 'b24331b1a138cde62aa1f679164fc62f', // abc@123
        role_id: 2,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     */
    return queryInterface.bulkDelete('users', null, {});
  }
}; 