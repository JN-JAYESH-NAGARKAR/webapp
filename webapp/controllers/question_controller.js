const v4 = require('uuidv4');
const SDC = require('statsd-client');
const db = require('../database/sequelize');
const validator = require('../services/validator');
const authorization = require('../services/authorization');
const questionService = require('../services/question_answer');
const fileService = require('../services/file');
const s3 = require('../controllers/file_controller').s3;
const logger = require('../config/logger');
const dbConfig = require("../config/db.config.js");
const User = db.user;
const Question = db.question;
const Category = db.category;

const sdc = new SDC({host: dbConfig.METRICS_HOSTNAME, port: dbConfig.METRICS_PORT});

exports.createQuestion = async (req, res) => {

    let start = Date.now();
    logger.info("Question POST Call");
    sdc.increment('endpoint.question.http.post');

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        logger.info("User Authorized..!");

        if(req.body.question_text){

            let inputCategories = req.body.categories;

            if(!inputCategories){

                let query_start = Date.now();

                let question = await Question.create({

                    question_id: v4.uuid(),
                    question_text: req.body.question_text
            
                });
                
                await user.addQuestion(question);
                await question.setCategories([]);

                let query_end = Date.now();
                var query_elapsed = query_end - query_start;
                sdc.timing('query.question.create', query_elapsed);
            
                const result = await questionService.findQuestionById(question.question_id);
            
                res.status(201).send(result.toJSON());

                logger.info("Question has been posted..!");
                
            } else {

                let empty = await validator.checkIfCategoryEmpty(req, res, inputCategories);

                if(empty){
    
                    let query_start_1 = Date.now();

                    let question = await Question.create({
    
                        question_id: v4.uuid(),
                        question_text: req.body.question_text
                
                    });
    
                    await user.addQuestion(question);
    
                    for(let i=0; i<inputCategories.length; i++){
            
                        let inputCategory = inputCategories[i];
                        let value = inputCategory.category.toLowerCase();
                    
                        let check = validator.validateCategory(value);
    
                        if(check){
    
                            let query_start_2 = Date.now();
                            let [category, created] = await Category.findOrCreate({
                                where: {category: value}, 
                                defaults: {category_id: v4.uuid()}
                            });
                            let query_end_2 = Date.now();
                            let query_elapsed_2 = query_end_2 - query_start_2;
                            sdc.timing('query.category.create', query_elapsed_2);
    
                            await question.addCategory(category);
    
                        } else {
    
                            res.status(400).send({
                                message: "Category Name cannot have special characters."
                            });
                            logger.error("Invalid Category Name - Cannot have special characters");
    
                        }  
                    }

                    let query_end_1 = Date.now();
                    var query_elapsed_1 = query_end_1 - query_start_1;
                    sdc.timing('query.question.create', query_elapsed_1);
    
                    const result = await questionService.findQuestionById(question.question_id);
    
                    res.status(201).send(result.toJSON());

                    logger.info("Question has been posted..!");
                }
            }

        } else {

            res.status(400).send({
                message: "Please Enter Question Text."
            });
            logger.error("Incomplete Information - Missing Question Text");
        } 
    }

    let end = Date.now();
    var elapsed = end - start;
    sdc.timing('timer.question.http.post', elapsed);
}

exports.getAllQuestions = async (req, res) => {

    let start = Date.now();
    logger.info("Questions GET ALL Call");
    sdc.increment('endpoint.questions.http.get');

    const questions = await questionService.findAllQuestions();

    res.status(200).send(questions);

    logger.info("All Questions Retrieved..");
    let end = Date.now();
    var elapsed = end - start;
    sdc.timing('timer.questions.http.get', elapsed);

}

exports.getAQuestion = async (req, res) => {

    let start = Date.now();
    logger.info("Question GET Call");
    sdc.increment('endpoint.question.http.get');

    const question = await questionService.findQuestionById(req.params.questionID);
 
    if(question){

        res.status(200).send(question);
        logger.info("Question Found..!");
        

    } else {
        res.status(404).send({
            message: "Question doesnot exists!"
        });
        logger.error("No such Question exists..!");
    }

    let end = Date.now();
    var elapsed = end - start;
    sdc.timing('timer.question.http.get', elapsed);

 }

 exports.deleteAQuestion = async (req, res) => {

    let start = Date.now();
    logger.info("Question DELETE Call");
    sdc.increment('endpoint.question.http.delete');

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        const question = await questionService.findQuestionById(req.params.questionID);

        if(question){

            if(question.user_id === user.id){

                logger.info("User Authorized to Delete this Question..!");

                let answers = await question.getAnswers();

                if(answers.length !== 0){

                    res.status(400).send({
                        message: "Cannot delete this question."
                    });

                    logger.error("Cannot Delete Question - Answer Associated to it");

                } else {

                    let query_start = Date.now();

                    let question_attachments = await question.getAttachments();

                    question_attachments.forEach(async element => {
                        await fileService.questionDeleteFile(element, s3, question);
                    });

                    let result = await Question.destroy({ where: {question_id: question.question_id} });

                    if(result){
                        res.status(204).send();
                        logger.info("Question Deleted..!");

                    } else {
                        res.status(500).send();
                    }

                    let query_end = Date.now();
                    var query_elapsed = query_end - query_start;
                    sdc.timing('query.question.delete', query_elapsed);

                }

            } else {

                res.status(403).send({
                    message: "Unauthorized to delete this question."
                });
                logger.error("User Unauthorized to Delete this Question..!");

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
    sdc.timing('timer.question.http.delete', elapsed);

}

exports.updateAQuestion = async (req, res) => {

    let start = Date.now();
    logger.info("Question UPDATE Call");
    sdc.increment('endpoint.question.http.put');

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        const question = await questionService.findQuestionById(req.params.questionID);

        if(question){

            if(question.user_id === user.id){

                logger.info("User Authorized to Update this Question..!");

                let question_text = req.body.question_text;
                let categories = req.body.categories;

                if(!question_text && !categories){

                    res.status(400).send({
                        message: "Question Text or Categories required for Update!"
                    });

                    logger.error("Incomplete Information - Question Text or Category Required for Update");
        
                } else {

                    let query_start = Date.now();

                    if(!question_text){

                        if(typeof question_text === typeof ""){
                    
                            res.status(400).send({
                                message: "Question Text cannot be empty!"
                            });

                            logger.error("Question Text cannot be empty..!");

                            return;
                        } 
                        
                    } else {

                        question.question_text = question_text;
                    }

                    if(!(typeof categories === typeof undefined)){

                        let empty = await validator.checkIfCategoryEmpty(req, res, categories);

                        if(empty){

                            await question.setCategories([]);

                            for(let i=0; i<categories.length; i++){
        
                                let inputCategory = categories[i];
                                let value = inputCategory.category.toLowerCase();

                                let check = validator.validateCategory(value);
                                
                                if(check){

                                    let [category, created] = await Category.findOrCreate({
                                        where: {category: value}, 
                                        defaults: {category_id: v4.uuid()}
                                    });
                        
                                    await question.addCategory(category);

                                } else {

                                    res.status(400).send({
                                        message: "Category Name cannot have special characters."
                                    });
                                    logger.error("Invalid Category Name - Cannot have special characters");
                                }
                            }
                        }
                    }

                    await question.save();

                    let query_end = Date.now();
                    var query_elapsed = query_end - query_start;
                    sdc.timing('query.question.update', query_elapsed);


                    res.status(204).send({
                        message: "Updated Successfully!"
                    });

                    logger.info("Question Updated..!");  
                }

            } else {

                res.status(403).send({
                    message: "Unauthorized to update this question."
                });
                logger.error("User Unauthorized to Update this Question..!");
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
    sdc.timing('timer.question.http.put', elapsed);

}