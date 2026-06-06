const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MenuDraftItem = sequelize.define('MenuDraftItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  menuDraftId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'menu_drafts', key: 'id' },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'menu_draft_items',
  timestamps: false,
});

module.exports = MenuDraftItem;
