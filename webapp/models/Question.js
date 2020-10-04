module.exports = (sequelize, Sequelize) => {
    const Question = sequelize.define("Question", {

        question_id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            unique: true,
        },
      
        question_text: {
            type: Sequelize.STRING,
            allowNull: false
        }
      
      },
      
      {
        timestamps: true,
        updatedAt: 'updated_timestamp',
        createdAt: 'created_timestamp'
      }
      
      );

    return Question

};