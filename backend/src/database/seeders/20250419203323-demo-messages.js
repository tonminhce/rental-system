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
    return queryInterface.bulkInsert('messages', [
      {
        chat_room_id: 1,
        sender_id: 1,
        content: 'Hello, I am interested in your apartment listing.',
        created_at: new Date(new Date().setMinutes(new Date().getMinutes() - 30)),
        updated_at: new Date(new Date().setMinutes(new Date().getMinutes() - 30))
      },
      {
        chat_room_id: 1,
        sender_id: 2,
        content: 'Hi there! Thank you for your interest. Would you like to schedule a viewing?',
        created_at: new Date(new Date().setMinutes(new Date().getMinutes() - 25)),
        updated_at: new Date(new Date().setMinutes(new Date().getMinutes() - 25))
      },
      {
        chat_room_id: 1,
        sender_id: 1,
        content: 'Yes, that would be great. When are you available?',
        created_at: new Date(new Date().setMinutes(new Date().getMinutes() - 20)),
        updated_at: new Date(new Date().setMinutes(new Date().getMinutes() - 20))
      },
      {
        chat_room_id: 2,
        sender_id: 2,
        content: 'I wanted to ask about the parking situation at the villa.',
        created_at: new Date(new Date().setMinutes(new Date().getMinutes() - 15)),
        updated_at: new Date(new Date().setMinutes(new Date().getMinutes() - 15))
      },
      {
        chat_room_id: 2,
        sender_id: 3,
        content: 'There is covered parking for 2 cars and additional space for visitors.',
        created_at: new Date(new Date().setMinutes(new Date().getMinutes() - 10)),
        updated_at: new Date(new Date().setMinutes(new Date().getMinutes() - 10))
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
    return queryInterface.bulkDelete('messages', null, {});
  }
};