const v4 = require('uuidv4');
const SDC = require('statsd-client');
const db = require('../database/sequelize');
const logger = require('../config/logger');
const dbConfig = require("../config/db.config.js");
const Question = db.question;
const Category = db.category;
const Answer = db.answer;
const File = db.file;

const sdc = new SDC({host: dbConfig.METRICS_HOSTNAME, port: dbConfig.METRICS_PORT});

const findAllQuestions = async () => {

    let start = Date.now();
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

    let end = Date.now();
    var elapsed = end - start;
    sdc.timing('dbquery.questions.get', elapsed);

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