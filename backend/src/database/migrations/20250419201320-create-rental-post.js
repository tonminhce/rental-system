'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('rental_posts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      property_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      transaction_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      source_url: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      published_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      province: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      district: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      ward: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      street: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      displayed_address: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'active'
      },
      bedrooms: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      bathrooms: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('rental_posts');
  }
};
