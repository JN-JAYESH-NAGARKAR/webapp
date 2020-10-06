const v4 = require('uuidv4');
const db = require('../database/sequelize');
const validator = require('../services/validator');
const authorization = require('../services/authorization');
const questionService = require('../services/question_answer');
const User = db.user;
const Question = db.question;
const Category = db.category;

exports.createQuestion = async (req, res) => {

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        if(req.body.question_text){

            let inputCategories = req.body.categories;

            if(!inputCategories){

                let question = await Question.create({

                    question_id: v4.uuid(),
                    question_text: req.body.question_text
            
                });
                
                await user.addQuestion(question);
                await question.setCategories([]);
            
                const result = await questionService.findQuestionById(question.question_id);
            
                res.status(201).send(result.toJSON());

            } else {

                let empty = await validator.checkIfCategoryEmpty(req, res, inputCategories);

                if(empty){
    
                    let question = await Question.create({
    
                        question_id: v4.uuid(),
                        question_text: req.body.question_text
                
                    });
    
                    await user.addQuestion(question);
    
                    for(let i=0; i<inputCategories.length; i++){
            
                        let inputCategory = inputCategories[i];
                        let value = inputCategory.category.toLowerCase();
                    
                        let check = await validator.validateCategory(value);
    
                        // if(check){
    
                            let [category, created] = await Category.findOrCreate({
                                where: {category: value}, 
                                defaults: {category_id: v4.uuid()}
                            });
    
                            await question.addCategory(category);
    
                        // } else {
    
                            // res.status(400).send({
                            //     message: "Category Name cannot have special characters."
                            // });
    
                        // }  
                    }
    
                    const result = await questionService.findQuestionById(question.question_id);
    
                    res.status(201).send(result.toJSON());
    
                }

            }

              
    
        } else {

            res.status(400).send({
                message: "Please Enter Question Text."
            });
        } 
    }
}

exports.getAllQuestions = async (req, res) => {

   const questions = await questionService.findAllQuestions();

   res.status(200).send(questions);

}

exports.getAQuestion = async (req, res) => {

    const question = await questionService.findQuestionById(req.params.questionID);
 
    if(question){
        res.status(200).send(question);
    } else {
        res.status(404).send({
            message: "Question doesnot exists!"
        })
    }

 }

 exports.deleteAQuestion = async (req, res) => {

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        const question = await questionService.findQuestionById(req.params.questionID);

        if(question){

            if(question.user_id === user.id){

                let answers = await question.getAnswers();

                if(answers.length !== 0){

                    res.status(400).send({
                        message: "Cannot delete this question."
                    });

                } else {

                    let result = await Question.destroy({ where: {question_id: question.question_id} });

                    if(result){
                        res.status(204).send();
                    } else {
                        res.status(500).send();
                    }

                }

            } else {

                res.setHeader('WWW-Authenticate', 'Basic realm="example"');
                res.status(401).send({
                    message: "Unauthorized to delete this question."
                });

            }

        } else {

            res.status(404).send({
                message: "Question doesnot exists!"
            });
        }
    }
    
}

exports.updateAQuestion = async (req, res) => {

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        const question = await questionService.findQuestionById(req.params.questionID);

        if(question){

            if(question.user_id === user.id){

                let question_text = req.body.question_text;
                let categories = req.body.categories;

                if(!question_text && !categories){

                    res.status(400).send({
                        message: "Question Text or Categories required for Update!"
                    });
        
                } else {

                    if(!question_text){

                        if(typeof question_text === typeof ""){
                    
                            res.status(400).send({
                                message: "Question Text cannot be empty!"
                            });

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
                    
                                let [category, created] = await Category.findOrCreate({
                                    where: {category: value}, 
                                    defaults: {category_id: v4.uuid()}
                                })
                    
                                await question.addCategory(category);
                        
                            }

                        }

                    }

                    await question.save();

                    res.status(204).send({
                        message: "Updated Successfully!"
                    });
                }

            } else {

                res.setHeader('WWW-Authenticate', 'Basic realm="example"');
                res.status(401).send({
                    message: "Unauthorized to update this question."
                });

            }

        } else {

            res.status(404).send({
                message: "Question doesnot exists!"
            });

        }

    }

}