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
    return queryInterface.bulkInsert('favorite_lists', [
      {
        user_id: 1,
        rental_id: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 2,
        rental_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 2,
        rental_id: 3,
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
    return queryInterface.bulkDelete('favorite_lists', null, {});
  }
}; 