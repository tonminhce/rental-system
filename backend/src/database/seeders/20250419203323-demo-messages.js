'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Idempotent: skip when the first demo message already exists.
    const existing = await queryInterface.rawSelect('messages', {
      where: { content: 'Hello, I am interested in your apartment listing.' }
    }, ['id']);
    if (existing) {
      console.log('demo messages already seeded — skipping');
      return;
    }
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
    // Messages reference hard-coded demo room ids that can collide with real
    // rows — deleting them could destroy real data, so this is a no-op.
    console.log('demo messages down() is a no-op (ids may be real)');
  }
};