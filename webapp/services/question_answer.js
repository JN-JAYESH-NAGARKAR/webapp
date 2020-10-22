const db = require('../database/sequelize');
const v4 = require('uuidv4');
const Question = db.question;
const Category = db.category;
const Answer = db.answer;
const File = db.file;

const findAllQuestions = async () => {

    const questions = await Question.findAll({
        include: [
            {
                 as: 'categories',
                 model: Category,
                 through: {
                     attributes: []
                 }
            }, 
            {
                 as: 'answers',
                 model: Answer,
                 include: [
                    {
                        as: 'attachments',
                        model: File
                   }
                ]
            },
            {
                as: 'attachments',
                model: File
           }
        ]
    });

    return questions;
}

const findQuestionById = async (id) => {

    const question = await Question.findOne({
        where: {question_id: id }, 
        include: [
            {
                 as: 'categories',
                 model: Category,
                 through: {
                     attributes: []
                 }
            }, 
            {
                 as: 'answers',
                 model: Answer,
                 include: [
                    {
                        as: 'attachments',
                        model: File
                   }
                ]
            },
            {
                as: 'attachments',
                model: File
           }
        ]
    });

    return question;

}

const findAnswerById = async (answer_id, question_id) => {

    const answer = await Answer.findOne({
        where: {answer_id, question_id }, 
        include: [
            {
                as: 'attachments',
                model: File
           }
        ]
    });

    return answer;

}

module.exports = {findQuestionById, findAllQuestions, findAnswerById};