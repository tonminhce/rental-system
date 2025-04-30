'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tạo table user_profiles
    await queryInterface.createTable('user_profiles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users', // Tên table mà user_id tham chiếu tới
          key: 'id', // Tên field tham chiếu
        },
        onDelete: 'CASCADE', // Nếu user bị xóa thì profile cũng sẽ bị xóa
      },
      gender: {
        type: Sequelize.ENUM('Male', 'Female'),
        allowNull: false,
      },
      lifestyle: {
        type: Sequelize.ENUM('Clean', 'Normal', 'Messy'),
        allowNull: false,
      },
      pets: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      smoking: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      personality: {
        type: Sequelize.ENUM('Introvert', 'Extrovert'),
        allowNull: false,
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      wake_up_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      bed_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      total_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Xóa table user_profiles nếu rollback
    await queryInterface.dropTable('user_profiles');
  }
};
