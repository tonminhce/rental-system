'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Idempotent: skip when the demo images are already there (repeat boots).
    const existing = await queryInterface.rawSelect('rental_images', {
      where: { url: 'https://example.com/images/apartment1_1.jpg' }
    }, ['id']);
    if (existing) {
      console.log('demo rental images already seeded — skipping');
      return;
    }
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
    // Only the rows this seeder created — never the whole rental_images table.
    return queryInterface.bulkDelete('rental_images', {
      url: { [Sequelize.Op.like]: 'https://example.com/images/%' }
    }, {});
  }
}; 