const dbConfig = require("../config/db.config.js");

const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    operatorsAliases: false,
    define: {
      timestamps: false
  },
  
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle
    }
});
  
const db = {};
  
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("../models/User")(sequelize, Sequelize);
db.question = require('../models/Question')(sequelize, Sequelize);
db.category = require('../models/Category')(sequelize,Sequelize);
db.answer = require('../models/Answer')(sequelize,Sequelize);

db.user.hasMany(db.question, {as: 'questions', foreignKey: 'user_id'});
db.question.hasMany(db.answer, {as: 'answers', foreignKey:'question_id'});
db.user.hasMany(db.answer, {as: 'answers', foreignKey:'user_id'});
db.question.belongsToMany(db.category, { as: 'categories', through: 'question_category', foreignKey: 'question_id', otherKey: 'category_id' });
db.category.belongsToMany(db.question, { as:'questions', through: 'question_category', foreignKey: 'category_id', otherKey: 'question_id' });

module.exports = db;