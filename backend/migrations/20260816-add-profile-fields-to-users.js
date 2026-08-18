'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'educationDetails', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'institutionalDetails', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'areaOfInterest', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'certificatesEarned', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'educationDetails');
    await queryInterface.removeColumn('Users', 'institutionalDetails');
    await queryInterface.removeColumn('Users', 'areaOfInterest');
    await queryInterface.removeColumn('Users', 'certificatesEarned');
  }
};
