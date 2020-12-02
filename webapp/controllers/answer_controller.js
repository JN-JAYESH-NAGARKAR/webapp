const v4 = require('uuidv4');
const SDC = require('statsd-client');
const db = require('../database/sequelize');
const authorization = require('../services/authorization');
const questionService = require('../services/question_answer');
const answerService = require('../services/question_answer');
const fileService = require('../services/file');
const s3 = require('../controllers/file_controller').s3;
const logger = require('../config/logger');
const dbConfig = require("../config/db.config.js");
const AWS = require('aws-sdk');
require('dotenv').config();
const User = db.user;
const Answer = db.answer;


const sdc = new SDC({host: dbConfig.METRICS_HOSTNAME, port: dbConfig.METRICS_PORT});

AWS.config.update({ region: process.env.AWS_REGIONn});
const SNS = new AWS.SNS({apiVersion: '2010-03-31'});

exports.postAnswer = async (req, res) => {

    let start = Date.now();
    logger.info("Answer POST Call");
    sdc.increment('endpoint.answer.http.post');

    let user = await authorization.authorizeAndGetUser(req, res, User);
   
    if(user){

        logger.info("User Authorized..!");

        if(req.body.answer_text){

            const question = await questionService.findQuestionById(req.params.questionID);

            if(question){
                
                logger.info("Question found..!");

                let query_start = Date.now();

                let answer = await Answer.create({

                    answer_id: v4.uuid(),
                    answer_text: req.body.answer_text
        
                });

                await question.addAnswer(answer);
                await user.addAnswer(answer);

                let query_end = Date.now();
                let query_elapsed = query_end - query_start;
                sdc.timing('query.answer.create', query_elapsed);

                const result = await answerService.findAnswerById(answer.answer_id, req.params.questionID);

                const userOfQuestion = await User.findOne({ where: { id: question.user_id }})

                const data = {

                    ToAddresses: userOfQuestion,
                    user: user,
                    question: question,
                    answer: answer,
                    questionGetApi: process.env.AWS_ENVIORMENT+"."+process.env.DOMAIN_NAME+"/v1/question/"+question.question_id,
                    answerGetApi: process.env.AWS_ENVIORMENT+"."+process.env.DOMAIN_NAME+"/v1/question/"+question.question_id+"/answer/"+answer.answer_id,
                    type: "POST"

                }

                const params = {

                    Message: JSON.stringify(data),
                    TopicArn: process.env.AWS_TOPIC_ARN

                }

                let publishTextPromise = SNS.publish(params).promise();

                publishTextPromise.then(
                    function(data) {

                        console.log(`Message sent to the topic ${params.TopicArn}`);
                        console.log("MessageID is " + data.MessageId);
                        res.status(201).send(result.toJSON());
                        logger.info("Answer has been posted..!");

                    }).catch(
                    function(err) {

                        console.error(err, err.stack);
                        res.status(500).send(err)
                    }); 
                
            } else {
                
                res.status(404).send({
                    message: "Question doesnot exists!"
                });
                logger.error("No such Question exists..!");
            }

        } else {

            res.status(400).send({
                message: "Please Enter Answer Text."
            });
            logger.error("Incomplete Information - Missing Answer Text");
        }
    } 

    let end = Date.now();
    var elapsed = end - start;
    sdc.timing('timer.answer.http.post', elapsed);
}

exports.getAnswer = async (req, res) => {

    let start = Date.now();
    logger.info("Answer GET Call");
    sdc.increment('endpoint.answer.http.get');

    const question = await questionService.findQuestionById(req.params.questionID);

    if(question){
        
        const answer = await answerService.findAnswerById(req.params.answerID, req.params.questionID);

        if(answer){

            res.status(200).send(answer);
            logger.info("Answer Found..!");

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

    let end = Date.now();
    var elapsed = end - start;
    sdc.timing('timer.answer.http.get', elapsed);
}

exports.deleteAnswer = async (req, res) => {

    let start = Date.now();
    logger.info("Answer DELETE Call");
    sdc.increment('endpoint.answer.http.delete');

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        const question = await questionService.findQuestionById(req.params.questionID);

        if(question){

            const answer = await answerService.findAnswerById(req.params.answerID, req.params.questionID);

            if(answer){

                if(answer.user_id === user.id){

                    logger.info("User Authorized to Delete this Answer..!");
                    
                    let query_start = Date.now();

                    let attachments = await answer.getAttachments();

                    attachments.forEach(async element => {
                        await fileService.answerDeleteFile(element, s3, answer);
                    });
                    let result = await Answer.destroy({ where: {answer_id: answer.answer_id} });

                    let query_end = Date.now();
                    var query_elapsed = query_end - query_start;
                    sdc.timing('query.answer.delete', query_elapsed);

                    if(result){


                        const userOfQuestion = await User.findOne({ where: { id: question.user_id }})

                        const data = {

                            ToAddresses: userOfQuestion,
                            user: user,
                            question: question,
                            answer: answer,
                            questionGetApi: process.env.AWS_ENVIORMENT+"."+process.env.DOMAIN_NAME+"/v1/question/"+question.question_id,
                            answerGetApi: process.env.AWS_ENVIORMENT+"."+process.env.DOMAIN_NAME+"/v1/question/"+question.question_id+"/answer/"+answer.answer_id,
                            type: "DELETE"

                        }

                        const params = {

                            Message: JSON.stringify(data),
                            TopicArn: process.env.AWS_TOPIC_ARN

                        }
                        let publishTextPromise = SNS.publish(params).promise();
                        publishTextPromise.then(
                            function(data) {

                                console.log(`Message sent to the topic ${params.TopicArn}`);
                                console.log("MessageID is " + data.MessageId);
                                res.status(204).send();
                                logger.info("Answer Deleted..!");

                            }).catch(

                            function(err) {
                                console.error(err, err.stack);
                                res.status(500).send(err);

                            });

                        

                    } else {
                        res.status(500).send();
                    }

                } else {
                    
                    res.status(403).send({
                        message: "Unauthorized to delete this answer."
                    });
                    logger.error("User Unauthorized to Delete this Answer..!");
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
    sdc.timing('timer.answer.http.delete', elapsed);
}

exports.updateAnswer = async (req, res) => {

    let start = Date.now();
    logger.info("Answer UPDATE Call");
    sdc.increment('endpoint.answer.http.put');

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        const question = await questionService.findQuestionById(req.params.questionID);

        if(question){

            const answer = await answerService.findAnswerById(req.params.answerID, req.params.questionID);

            if(answer){

                if(answer.user_id === user.id){     

                    logger.info("User Authorized to Update this Answer..!");
                    
                    let answer_text = req.body.answer_text;
    
                    if(answer_text){

                        answer.answer_text = answer_text;

                        let query_start = Date.now();

                        await answer.save();

                        let query_end = Date.now();
                        let query_elapsed = query_end - query_start;
                        sdc.timing('query.answer.update', query_elapsed);

                        const userOfQuestion = await User.findOne({ where: { id: question.user_id }})

                        const data = {

                            ToAddresses: userOfQuestion,
                            user: user,
                            question: question,
                            updatedAnswerText: req.body.answer_text,
                            answer: answer,
                            questionGetApi: process.env.AWS_ENVIORMENT+"."+process.env.DOMAIN_NAME+"/v1/question/"+question.question_id,
                            answerGetApi: process.env.AWS_ENVIORMENT+"."+process.env.DOMAIN_NAME+"/v1/question/"+question.question_id+"/answer/"+answer.answer_id,
                            type: "UPDATE"

                        }

                        const params = {

                            Message: JSON.stringify(data),
                            TopicArn: process.env.AWS_TOPIC_ARN

                        }

                        let publishTextPromise = SNS.publish(params).promise();

                        publishTextPromise.then(
                            function(data) {

                                console.log(`Message sent to the topic ${params.TopicArn}`);
                                console.log("MessageID is " + data.MessageId);
                                res.status(204).send()
                                res.status(204).send({ message: "Updated Successfully!" });
                                logger.info("Answer Updated..!");

                            }).catch(

                            function(err) {
                                console.error(err, err.stack);
                                res.status(500).send(err);

                            });

                    } else {

                        res.status(400).send({
                            message: "Please Enter Answer Text."
                        });
                        logger.error("Answer Text cannot be empty..!");
                    }
    
                } else {
                    
                    res.status(403).send({
                        message: "Unauthorized to update this answer."
                    });
                    logger.error("User Unauthorized to Update this Answer..!");
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
    sdc.timing('timer.answer.http.put', elapsed);
}
