'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    return queryInterface.bulkInsert('chat_room_members', [
      {
        chat_room_id: 1,
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        chat_room_id: 1,
        user_id: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        chat_room_id: 2,
        user_id: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        chat_room_id: 2,
        user_id: 3,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return queryInterface.bulkDelete('chat_room_members', null, {});
  }
}; 