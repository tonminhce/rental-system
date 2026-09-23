'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Idempotent: skip when the first demo membership already exists.
    const existing = await queryInterface.rawSelect('chat_room_members', {
      where: { chat_room_id: 1, user_id: 1 }
    }, ['id']);
    if (existing) {
      console.log('demo chat room members already seeded — skipping');
      return;
    }
    return queryInterface.bulkInsert('chat_room_members', [
      {
        chat_room_id: 1,
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        chat_room_id: 1,
        user_id: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        chat_room_id: 2,
        user_id: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        chat_room_id: 2,
        user_id: 3,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Memberships reference hard-coded demo ids that can collide with real
    // rows — deleting them could destroy real data, so this is a no-op.
    console.log('demo chat room members down() is a no-op (ids may be real)');
  }
}; 