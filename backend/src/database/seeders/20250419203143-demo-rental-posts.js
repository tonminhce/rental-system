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
    return queryInterface.bulkInsert('rental_posts', [
      {
        name: 'Luxurious Apartment in District 1',
        description: 'A beautiful apartment with amazing views of the city skyline. Perfect for a small family or professionals.',
        price: 1500.00,
        property_type: 'Apartment',
        transaction_type: 'Rent',
        source_url: 'https://example.com/listing/1',
        province: 'Ho Chi Minh City',
        district: 'District 1',
        ward: 'Ben Nghe',
        street: '123 Le Loi Street',
        latitude: 10.775844,
        longitude: 106.701273,
        displayed_address: '123 Le Loi Street, Ben Nghe, District 1, Ho Chi Minh City',
        status: 'active',
        bedrooms: 2,
        bathrooms: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Modern Villa in District 2',
        description: 'Spacious villa with garden and swimming pool. Great for family living with privacy and comfort.',
        price: 3000.00,
        property_type: 'Villa',
        transaction_type: 'Rent',
        source_url: 'https://example.com/listing/2',
        province: 'Ho Chi Minh City',
        district: 'District 2',
        ward: 'Thao Dien',
        street: '45 Nguyen Van Huong Street',
        latitude: 10.808252,
        longitude: 106.737379,
        displayed_address: '45 Nguyen Van Huong Street, Thao Dien, District 2, Ho Chi Minh City',
        status: 'active',
        bedrooms: 4,
        bathrooms: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Cozy Studio Apartment in District 3',
        description: 'Compact and stylish studio apartment, perfect for singles or couples. Central location with easy access to public transport.',
        price: 800.00,
        property_type: 'Studio',
        transaction_type: 'Rent',
        source_url: 'https://example.com/listing/3',
        province: 'Ho Chi Minh City',
        district: 'District 3',
        ward: 'Ward 7',
        street: '78 Nguyen Thien Thuat Street',
        latitude: 10.779861,
        longitude: 106.679406,
        displayed_address: '78 Nguyen Thien Thuat Street, Ward 7, District 3, Ho Chi Minh City',
        status: 'active',
        bedrooms: 1,
        bathrooms: 1,
        created_at: new Date(),
        updated_at: new Date()
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
    return queryInterface.bulkDelete('rental_posts', null, {});
  }
}; 