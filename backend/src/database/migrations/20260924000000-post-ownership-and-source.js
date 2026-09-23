'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Ownership: existing rows stay NULL (legacy, ownerless).
    await queryInterface.addColumn('rental_posts', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addIndex('rental_posts', ['user_id'], {
      name: 'rental_posts_user_id_idx',
    });
    await queryInterface.addConstraint('rental_posts', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_rental_posts_user_id',
      references: { table: 'users', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    // Provenance: crawler ingestion sets 'crawler'; default stays 'user'.
    await queryInterface.addColumn('rental_posts', 'source', {
      type: Sequelize.ENUM('user', 'crawler'),
      allowNull: false,
      defaultValue: 'user',
    });
    // favorite_lists(user_id, rental_id) is already UNIQUE ('unique_user_rental')
    // since 20250419201808-create-favorite-list, so no dedupe/index needed here —
    // addFavorite just has to treat the unique violation as success.
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('rental_posts', 'source');
    await queryInterface.removeConstraint('rental_posts', 'fk_rental_posts_user_id');
    await queryInterface.removeColumn('rental_posts', 'user_id');
  },
};
