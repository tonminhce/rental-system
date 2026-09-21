'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex(
      'rental_posts',
      ['status', 'transaction_type', 'latitude', 'longitude'],
      { name: 'rental_posts_map_viewport' },
    );
    await queryInterface.addIndex(
      'rental_posts',
      ['status', 'transaction_type', 'created_at', 'id'],
      { name: 'rental_posts_stable_page' },
    );
  },
  async down(queryInterface) {
    await queryInterface.removeIndex(
      'rental_posts',
      'rental_posts_map_viewport',
    );
    await queryInterface.removeIndex(
      'rental_posts',
      'rental_posts_stable_page',
    );
  },
};
