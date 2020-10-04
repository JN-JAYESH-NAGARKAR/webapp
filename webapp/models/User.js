module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("User", {

        id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            unique: true,
        },

        first_name: {
            type: Sequelize.STRING,
            allowNull: false
        },

        last_name: {
            type: Sequelize.STRING,
            allowNull: false
        },

        username: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: false,
        },

        password: {
            type: Sequelize.STRING,
            allowNull: false
        }

    },

    {
        timestamps: true,
        updatedAt: 'account_updated',
        createdAt: 'account_created'
      }
    
    );

    return User

};