module.exports = (sequelize, Sequelize) => {
    const Category = sequelize.define("Category", {

        category_id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            unique: true,
        },
      
        category: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
        }
      
      }
      
      );

    return Category

};