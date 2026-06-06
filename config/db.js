const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'event_management',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      freezeTableName: true,
      timestamps: true,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`MySQL Connected: ${sequelize.config.host}`);

    // Sync all models (creates tables if they don't exist)
    await sequelize.sync({ alter: false });
    console.log('Database tables synchronized');

    // Seed default users if none exist
    const { User } = require('../models');
    const count = await User.count();
    if (count === 0) {
      await User.create({ name: 'Admin User', email: 'admin@eventpro.com', password: 'admin123', role: 'admin', phone: '+92 300 0000000' });
      await User.create({ name: 'Vendor User', email: 'vendor@eventpro.com', password: 'vendor123', role: 'vendor', phone: '+92 300 0000001' });
      await User.create({ name: 'Customer User', email: 'customer@eventpro.com', password: 'customer123', role: 'customer', phone: '+92 300 0000002' });
      console.log('Default users seeded');
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
