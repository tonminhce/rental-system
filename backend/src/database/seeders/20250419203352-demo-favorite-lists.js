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
    // ignoreDuplicates: the unique_user_rental index makes repeat boots a no-op.
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
    ], { ignoreDuplicates: true });
  },

  async down(queryInterface, Sequelize) {
    // Favorites reference hard-coded demo user/rental ids that can collide
    // with real rows — deleting them could destroy real data, so no-op.
    console.log('demo favorite lists down() is a no-op (ids may be real)');
  }
}; 