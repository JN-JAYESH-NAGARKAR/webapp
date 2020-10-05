module.exports = (sequelize, Sequelize) => {
    const Answer = sequelize.define("Answer", {

        answer_id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            unique: true,
        },
      
        answer_text: {
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

    return Answer;

};