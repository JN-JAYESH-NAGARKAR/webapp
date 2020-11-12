const v4 = require('uuidv4');
const fs = require('fs');
const _ = require('underscore');
const SDC = require('statsd-client');
const db = require('../database/sequelize');
const logger = require('../config/logger');
const File = db.file;

const sdc = new SDC({host: dbConfig.METRICS_HOSTNAME, port: dbConfig.METRICS_PORT});

const questionFileUpload = async (source, targetName, s3, Question, fileId, req, res) => {

    fs.readFile(source, async (err, filedata) => {
       
        if (!err) {

            let s3_start = Date.now();

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
                    logger.error(err);

                } else {
                    
                    const aws_metadata = JSON.parse(JSON.stringify(data));

                    let query_start = Date.now();

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

                    let query_end = Date.now();
                    var query_elapsed = query_end - query_start;
                    sdc.timing('query.file.create', query_elapsed);

                    let query_start_1 = Date.now();
                    
                    let result = await File.findOne({where: {file_id: fileId}});

                    let query_end_1 = Date.now();
                    var query_elapsed_1 = query_end_1 - query_start_1;
                    sdc.timing('query.file.get', query_elapsed_1);

                    res.status(201).send(_.pick(result, ['file_id', 'file_name', 's3_object_name', 'created_date', 
                                                            'content_type', 'size']));
                    logger.info("File Attached to Question..!");
                }
            });
            let s3_end = Date.now();
            var s3_elapsed = s3_end - s3_start;
            sdc.timing('s3.file.upload', s3_elapsed);

        } else {

            res.status(500).send({
                message: err
            });
            logger.error(err)
        }
    });
}

const questionDeleteFile = async (file, s3, question) => {

    let s3_start = Date.now();

    let deleted = true;
    const params = {

        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.s3_object_name,

    }
    
    await s3.deleteObject(params, async(err, data) => {

        if(err){

            deleted = false;
            logger.error(err)

        } else {

            let query_start = Date.now();

            await question.removeAttachment(file);
            await File.destroy({where: {file_id: file.file_id}});

            let query_end = Date.now();
            var query_elapsed = query_end - query_start;
            sdc.timing('query.file.delete', query_elapsed);

            deleted = true;
        }
    });

    let s3_end = Date.now();
    let s3_elapsed = s3_end - s3_start;
    sdc.timing('s3.file.delete', s3_elapsed);

    return deleted;
}

const answerFileUpload = async (source, targetName, s3, Answer, fileId, req, res) => {

    fs.readFile(source, async (err, filedata) => {

        if (!err) {

            let s3_start = Date.now();

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
                    logger.error(err);

                } else {

                    const aws_metadata = JSON.parse(JSON.stringify(data));

                    let query_start = Date.now();

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

                    let query_end = Date.now();
                    var query_elapsed = query_end - query_start;
                    sdc.timing('query.file.create', query_elapsed);

                    let query_start_1 = Date.now();

                    let result = await File.findOne({where: {file_id: fileId}});

                    let query_end_1 = Date.now();
                    var query_elapsed_1 = query_end_1 - query_start_1;
                    sdc.timing('query.file.get', query_elapsed_1);

                    res.status(201).send(_.pick(result, ['file_id', 'file_name', 's3_object_name', 'created_date', 
                                                            'content_type', 'size']));
                    logger.info("File Attached to Answer..!");
                }
            });

            let s3_end = Date.now();
            var s3_elapsed = s3_end - s3_start;
            sdc.timing('s3.file.upload', s3_elapsed);

        } else {

            res.status(500).send({
                message: err
            });
            logger.error(err);
        }
    });
}

const answerDeleteFile = async (file, s3, Answer) => {

    let s3_start = Date.now();

    let deleted = true;

    const params = {

        Bucket: process.env.AWS_BUCKET_NAME,
        Key: file.s3_object_name,

    }
    
    await s3.deleteObject(params, async(err, data) => {

        if(err){

            deleted = false;
            logger.error(err);

        } else {

            let query_start = Date.now();

            await Answer.removeAttachment(file);
            await File.destroy({where: {file_id: file.file_id}});

            let query_end = Date.now();
            var query_elapsed = query_end - query_start;
            sdc.timing('query.file.delete', query_elapsed);

            deleted = true;
        }
    });

    let s3_end = Date.now();
    var s3_elapsed = s3_end - s3_start;
    sdc.timing('s3.file.delete', s3_elapsed);

    return deleted;
}

module.exports = {questionFileUpload, answerFileUpload, questionDeleteFile, answerDeleteFile};