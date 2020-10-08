const v4 = require('uuidv4');
const db = require('../database/sequelize');
const authorization = require('../services/authorization');
const questionService = require('../services/question_answer');
const answerService = require('../services/question_answer');
const User = db.user;
const Answer = db.answer;


exports.postAnswer = async (req, res) => {

    let user = await authorization.authorizeAndGetUser(req, res, User);
   
    if(user){

        if(req.body.answer_text){

            const question = await questionService.findQuestionById(req.params.questionID);

            if(question){
                
                let answer = await Answer.create({

                    answer_id: v4.uuid(),
                    answer_text: req.body.answer_text
        
                });

                await question.addAnswer(answer);
                await user.addAnswer(answer);

                const result = await answerService.findAnswerById(answer.answer_id, req.params.questionID);
    
                res.status(201).send(result.toJSON());
                
            } else {
                
                res.status(404).send({
                    message: "Question doesnot exists!"
                });
            }

        } else {

            res.status(400).send({
                message: "Please Enter Answer Text."
            });

        }
    } 


}

exports.getAnswer = async (req, res) => {

    const question = await questionService.findQuestionById(req.params.questionID);

    if(question){
        
        const answer = await answerService.findAnswerById(req.params.answerID, req.params.questionID);

        if(answer){

            res.status(200).send(answer);

        } else {

            res.status(404).send({
                message: "Answer doesnot exists!"
            });

        }

    } else {
        res.status(404).send({
            message: "Question doesnot exists!"
        });
    }
}

exports.deleteAnswer = async (req, res) => {

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        const question = await questionService.findQuestionById(req.params.questionID);

        if(question){

            const answer = await answerService.findAnswerById(req.params.answerID, req.params.questionID);

            if(answer){

                if(answer.user_id === user.id){

                    let result = await Answer.destroy({ where: {answer_id: answer.answer_id} });

                    if(result){
                        res.status(204).send();
                    } else {
                        res.status(500).send();
                    }


                } else {
                    
                    res.status(403).send({
                        message: "Unauthorized to delete this answer."
                    });
    
                }
    
            } else {
    
                res.status(404).send({
                    message: "Answer doesnot exists!"
                });
    
            }
    
        } else {

            res.status(404).send({
                message: "Question doesnot exists!"
            });
        }
    }
    
}

exports.updateAnswer = async (req, res) => {

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        const question = await questionService.findQuestionById(req.params.questionID);

        if(question){

            const answer = await answerService.findAnswerById(req.params.answerID, req.params.questionID);

            if(answer){

                if(answer.user_id === user.id){     
                    
                    let answer_text = req.body.answer_text;
    
                    if(answer_text){

                        answer.answer_text = answer_text;

                        await answer.save();
    
                        res.status(204).send({
                            message: "Updated Successfully!"
                        });

                    } else {

                        res.status(400).send({
                            message: "Please Enter Answer Text."
                        });
                        
                    }
    
                } else {
                    
                    res.status(403).send({
                        message: "Unauthorized to update this answer."
                    });
    
                }

            } else {

                res.status(404).send({
                    message: "Answer doesnot exists!"
                });

            }

        } else {

            res.status(404).send({
                message: "Question doesnot exists!"
            });

        }

    }

}
