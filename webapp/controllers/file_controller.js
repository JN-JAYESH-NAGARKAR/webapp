const v4 = require('uuidv4');
const express = require('express');
const SDC = require('statsd-client');
const db = require('../database/sequelize');
const authorization = require('../services/authorization');
const questionService = require('../services/question_answer');
const answerService = require('../services/question_answer');
const fileService = require('../services/file');
const multer  = require('multer');
const AWS = require('aws-sdk');
const path = require('path');
const logger = require('../config/logger');
const dbConfig = require("../config/db.config.js");
const User = db.user;
const router = express.Router();
const fs = require('fs');

const sdc = new SDC({host: dbConfig.METRICS_HOSTNAME, port: dbConfig.METRICS_PORT});

//setting the credentials
//The region should be the region of the bucket that you created
AWS.config.update({
    
  region: process.env.AWS_REGION

});

//Creating a new instance of S3:
const s3 = new AWS.S3();
const bucket = process.env.AWS_BUCKET_NAME;

const storage = multer.diskStorage({
    destination : 'uploads/',
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    },
    limits:{ fileSize: 2000000 }
});
const upload = multer({storage}); 

//Attach a file to Question
router.post('/:questionID/file', upload.single('image'), async (req, res) => {

    let start = Date.now();
    logger.info("Question File POST Call");
    sdc.increment('endpoint.question.file.http.post');

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        const question = await questionService.findQuestionById(req.params.questionID);

        if(question){

            if(question.user_id === user.id){

                logger.info("User Authorized to Add File this Question..!");

                if(!req.file){
                    res.status(400).send({
                        message: 'No File Uploaded!'
                    });
                    logger.error("No File Uploaded..!");
                }
                 
                const filetypes = /jpeg|jpg|png/;
                const extname = filetypes.test( path.extname( req.file.originalname ).toLowerCase());
                const mimetype = filetypes.test( req.file.mimetype );

                
                if(!mimetype && !extname){

                    res.status(400).send({
                        message: 'Unsupported File Type'
                    });
                    logger.error("Unsupported File Format..!");

                } else {

                    const fileId = v4.uuid();

                    const fileName = req.params.questionID + "/" + fileId + "/" + path.basename( req.file.originalname, path.extname( req.file.originalname ) ) + path.extname( req.file.originalname);

                    await fileService.questionFileUpload(req.file.path, fileName, s3, question, fileId, req, res);

                }

                fs.unlink(req.file.path, () => {});

            } else {

                res.status(401).send({
                    message: "Unauthorized to add image to this question."
                });
                logger.error("User Unauthorized to Add File to this Question..!");
            }

        } else {

            res.status(404).send({
                message: "Question doesnot exists!"
            });
            logger.error("No such Question exists..!");
        }
    }
    
    let end = Date.now();
    var elapsed = end - start;
    sdc.timing('timer.question.file.http.post', elapsed);
});

//Delete a file to Question
router.delete('/:questionID/file/:fileID', async (req, res) => {

    let start = Date.now();
    logger.info("Question File DELETE Call");
    sdc.increment('endpoint.question.file.http.delete');

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        const question = await questionService.findQuestionById(req.params.questionID);

        if(question){

            if(question.user_id === user.id){

                logger.info("User Authorized to Delete this Question File..!");

                let query_start = Date.now();

                const file = await question.getAttachments({ where: {file_id: req.params.fileID}});

                let query_end = Date.now();
                var query_elapsed = query_end - query_start;
                sdc.timing('query.files.get', query_elapsed);

                if(file.length !== 0){

                    const obFile = file[0];

                    const result = await fileService.questionDeleteFile(obFile, s3, question, res);

                    if(result){

                        res.status(204).send();
                        logger.info("Question File Deleted..!");

                    } else {

                        res.status(500).send({
                            message: err
                         });
                         logger.error(err);
                    }
                   
                } else{

                    res.status(404).send({
                        message: "File doesnot exists!"
                    });
                    logger.error("No such Question File exists..!");
                }

            } else {

                res.status(401).send({
                    message: "Unauthorized to delete image to this question."
                });
                logger.error("User Unauthorized to Delete this Question File..!");
            }

        } else {

            res.status(404).send({
                message: "Question doesnot exists!"
            });
            logger.error("No such Question exists..!");
        }
    }

    let end = Date.now();
    var elapsed = end - start;
    sdc.timing('timer.question.file.http.delete', elapsed);
});


//Attach a file to Answer
router.post('/:questionID/answer/:answerID/file', upload.single('image'), async (req, res) => {

    let start = Date.now();
    logger.info("Answer File POST Call");
    sdc.increment('endpoint.answer.file.http.post');

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        const question = await questionService.findQuestionById(req.params.questionID);

        if(question){

            const answer = await answerService.findAnswerById(req.params.answerID, req.params.questionID);

            if(answer){

                if(answer.user_id === user.id){

                    logger.info("User Authorized to Add File this Answer..!");

                    if(!req.file){

                        res.status(400).send({
                            message: 'No File Uploaded!'
                        });
                        logger.error("No File Uploaded..!");
                    }

                    const filetypes = /jpeg|jpg|png/;
                    const extname = filetypes.test( path.extname( req.file.originalname ).toLowerCase());
                    const mimetype = filetypes.test( req.file.mimetype );
    
                    if(!mimetype && !extname){

                        res.status(400).send({
                            message: 'Unsupported File Type'
                        });
                        logger.error("Unsupported File Format..!");

                    } else {
    
                        const fileId = v4.uuid();

                        const fileName = req.params.answerID + "/" + fileId + "/" + path.basename( req.file.originalname, path.extname( req.file.originalname ) ) + path.extname( req.file.originalname);

                        await fileService.answerFileUpload(req.file.path, fileName, s3, answer, fileId, req, res);

                    }
    
                    fs.unlink(req.file.path, () => {});
    
                } else {
    
                    res.status(401).send({
                        message: "Unauthorized to add image to this answer."
                    });
                    logger.error("User Unauthorized to Add File to this Answer..!");
                }

            } else {
    
                res.status(404).send({
                    message: "Answer doesnot exists!"
                });
                logger.error("No such Answer exists..!");
    
            }
            
        } else {

            res.status(404).send({
                message: "Question doesnot exists!"
            });
            logger.error("No such Question exists..!");
        }
    }
    
    let end = Date.now();
    var elapsed = end - start;
    sdc.timing('timer.answer.file.http.post', elapsed);
});

//Delete a file to Answer
router.delete('/:questionID/answer/:answerID/file/:fileID', async (req, res) => {

    let start = Date.now();
    logger.info("Answer File DELETE Call");
    sdc.increment('endpoint.answer.file.http.delete');

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        const question = await questionService.findQuestionById(req.params.questionID);

        if(question){

            const answer = await answerService.findAnswerById(req.params.answerID, req.params.questionID);

            if(answer){

                if(answer.user_id === user.id){

                    logger.info("User Authorized to Delete this Answer File..!");

                    let query_start = Date.now();

                    const file = await answer.getAttachments({ where: {file_id: req.params.fileID}});

                    let query_end = Date.now();
                    var query_elapsed = query_end - query_start;
                    sdc.timing('query.files.get', query_elapsed);

                    if(file.length !== 0){

                        const obFile = file[0];

                        const result = await fileService.answerDeleteFile(obFile, s3, answer, req.params.fileID, res);

                        if(result){
                        
                            res.status(204).send();
                            logger.info("Answer File Deleted..!");
    
                        } else {
    
                            res.status(500).send({
                                message: err
                             });
                             logger.error(err);
                        }

                    } else{

                        res.status(404).send({
                            message: "File doesnot exists!"
                        });
                        logger.error("No such Answer File exists..!");
                    }

                } else {

                    res.status(401).send({
                        message: "Unauthorized to delete image to this answer."
                    });
                    logger.error("User Unauthorized to Delete this Answer File..!");
                }

            } else {
    
                res.status(404).send({
                    message: "Answer doesnot exists!"
                });
                logger.error("No such Answer exists..!");
            }

        } else {

            res.status(404).send({
                message: "Question doesnot exists!"
            });
            logger.error("No such Question exists..!");
        }
    }

    let end = Date.now();
    var elapsed = end - start;
    sdc.timing('timer.answer.file.http.delete', elapsed);
});

module.exports = {router, s3};