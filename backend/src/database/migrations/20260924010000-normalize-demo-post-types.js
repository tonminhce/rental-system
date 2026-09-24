'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // One-time repair for DBs seeded before the demo seeder was normalized:
    // the DTO contract (get-posts.dto.ts) only accepts lowercase enum values,
    // so the old 'Apartment'/'Villa'/'Studio'/'Rent' rows made the post page's
    // "similar properties" query 400 and silently render empty.
    await queryInterface.sequelize.query(
      `UPDATE rental_posts
       SET property_type = LOWER(property_type), transaction_type = LOWER(transaction_type)
       WHERE source_url LIKE 'https://example.com/listing/%'`
    );
    await queryInterface.sequelize.query(
      `UPDATE rental_posts SET property_type = 'apartment'
       WHERE property_type = 'studio' AND source_url LIKE 'https://example.com/listing/%'`
    );
  },

  async down(queryInterface) {
    // Restore the original (invalid-per-DTO) demo values, exact per listing.
    await queryInterface.sequelize.query(
      `UPDATE rental_posts SET property_type = 'Apartment', transaction_type = 'Rent'
       WHERE source_url = 'https://example.com/listing/1'`
    );
    await queryInterface.sequelize.query(
      `UPDATE rental_posts SET property_type = 'Villa', transaction_type = 'Rent'
       WHERE source_url = 'https://example.com/listing/2'`
    );
    await queryInterface.sequelize.query(
      `UPDATE rental_posts SET property_type = 'Studio', transaction_type = 'Rent'
       WHERE source_url = 'https://example.com/listing/3'`
    );
  },
};
