module.exports = (sequelize, Sequelize) => {
    const File = sequelize.define("File", {

        file_id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            unique: true,
        },

        file_name: {
            type: Sequelize.STRING,
            allowNull: false
        },

        s3_object_name: {
            type: Sequelize.STRING,
            allowNull: false
        },

        size: {
            type: Sequelize.STRING,
            allowNull: false
        },

        content_type: {
            type: Sequelize.STRING,
            allowNull: false
        },

        url: {
            type: Sequelize.STRING,
            allowNull: false
        },

        aws_metadata_etag: {
            type: Sequelize.STRING,
            allowNull: false
        },

        aws_metadata_bucket: {
            type: Sequelize.STRING,
            allowNull: false

        }

    },

    {
        timestamps: true,
        createdAt: 'created_date',
        updatedAt: false
      }
    
    );

    return File

};