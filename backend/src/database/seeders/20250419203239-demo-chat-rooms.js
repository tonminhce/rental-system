'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Idempotent: the demo member/message seeds address rooms by id 1-2, so
    // skip whenever a room with id 2 already exists (seeded or real).
    const existing = await queryInterface.rawSelect('chat_rooms', {
      where: { id: 2 }
    }, ['id']);
    if (existing) {
      console.log('demo chat rooms already seeded — skipping');
      return;
    }
    return queryInterface.bulkInsert('chat_rooms', [
      {
        is_system: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        is_system: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    // No natural key distinguishes demo rooms from real ones — deleting by id
    // could destroy real data, so this is a deliberate no-op.
    console.log('demo chat rooms down() is a no-op (rooms have no seeded key)');
  }
}; 