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
    return queryInterface.bulkInsert('rental_images', [
      {
        rental_id: 1,
        url: 'https://example.com/images/apartment1_1.jpg',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        rental_id: 1,
        url: 'https://example.com/images/apartment1_2.jpg',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        rental_id: 1,
        url: 'https://example.com/images/apartment1_3.jpg',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        rental_id: 2,
        url: 'https://example.com/images/villa1_1.jpg',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        rental_id: 2,
        url: 'https://example.com/images/villa1_2.jpg',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        rental_id: 3,
        url: 'https://example.com/images/studio1_1.jpg',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        rental_id: 3,
        url: 'https://example.com/images/studio1_2.jpg',
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
    return queryInterface.bulkDelete('rental_images', null, {});
  }
}; 