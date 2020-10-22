const v4 = require('uuidv4');
const fs = require('fs');
const db = require('../database/sequelize');
const File = db.file;
const _ = require('underscore');

const questionFileUpload = async (source, targetName, s3, Question, fileId, req, res) => {

    fs.readFile(source, async (err, filedata) => {

        if (!err) {

            var params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: targetName,
                Body: filedata
            };

            await s3.upload(params, async(err, data) => {

                if(err){

                    res.status(500).send({
                        message: err
                    });

                } else {
                    
                    const aws_metadata = JSON.parse(JSON.stringify(data));

                    const file = await File.create({
                        file_id: fileId,
                        file_name: req.file.originalname,
                        s3_object_name: targetName,
                        content_type: req.file.mimetype,
                        size: req.file.size,
                        aws_metadata_etag:aws_metadata.ETag,
                        url: aws_metadata.Location,
                        aws_metadata_bucket: aws_metadata.Bucket
                    });
    
                    await Question.addAttachment(file);
                    
                    let result = await File.findOne({where: {file_id: fileId}});
                    res.status(201).send(_.pick(result, ['file_id', 'file_name', 's3_object_name', 'created_date', 'content_type', 'size']));

                }
            });

        } else {

            res.status(500).send({
                message: err
            });
        }
    });

}

const questionDeleteFile = async (file, s3, question) => {

    let deleted = true;
    const params = {

        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.s3_object_name,

    }

    await s3.deleteObject(params, async(err, data) => {

        if(err){

            deleted = false;

        } else {

            await question.removeAttachment(file);

            await File.destroy({where: {file_id: file.file_id}});

            deleted = true;
        }
        
    });

    return deleted;

}

const answerFileUpload = async (source, targetName, s3, Answer, fileId, req, res) => {

    fs.readFile(source, async (err, filedata) => {

        if (!err) {

            var params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: targetName,
                Body: filedata
            };

            await s3.upload(params, async(err, data) => {

                if(err){

                    res.status(500).send({
                        message: err
                    });

                } else {

                    const aws_metadata = JSON.parse(JSON.stringify(data));

                    const file = await File.create({
                        file_id: fileId,
                        file_name: req.file.originalname,
                        s3_object_name: targetName,
                        content_type: req.file.mimetype,
                        size: req.file.size,
                        aws_metadata_etag:aws_metadata.ETag,
                        url: aws_metadata.Location,
                        aws_metadata_bucket: aws_metadata.Bucket
                    });
    
                    await Answer.addAttachment(file);

                    let result = await File.findOne({where: {file_id: fileId}}) 
                    res.status(201).send(_.pick(result, ['file_id', 'file_name', 's3_object_name', 'created_date', 'content_type', 'size']));

                }
            });

        } else {

            res.status(500).send({
                message: err
            });
        }
    });

}

const answerDeleteFile = async (file, s3, answer) => {

    let deleted = true;

    const params = {

        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.s3_object_name,

    }

    await s3.deleteObject(params, async(err, data) => {

        if(err){

            deleted = false;

        } else {

            await answer.removeAttachment(file);

            await File.destroy({where: {file_id: file.file_id}});

            deleted = true;

        }
        
    });

    return deleted;

}

module.exports = {questionFileUpload, answerFileUpload, questionDeleteFile, answerDeleteFile};