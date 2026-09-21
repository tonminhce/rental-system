'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
    await queryInterface.changeColumn('rental_posts', 'price', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    });
    await queryInterface.changeColumn('rental_posts', 'area', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addIndex(
      'rental_posts',
      ['status', 'transaction_type', 'district'],
      { name: 'rental_posts_search_idx' },
    );
  },
  async down() {
    throw new Error(
      'This migration is intentionally forward-only: shrinking password/decimal columns would lose data. Restore a reviewed backup instead.',
    );
  },
};
