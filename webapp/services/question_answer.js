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

    let query_start = Date.now();
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

    let query_end = Date.now();
    var query_elapsed = query_end - query_start;
    sdc.timing('query.questions.get', query_elapsed);

    return questions;

}

const findQuestionById = async (id) => {

    let query_start = Date.now();
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

    let query_end = Date.now();
    var query_elapsed = query_end - query_start;
    sdc.timing('query.question.get', query_elapsed);

    return question;

}

const findAnswerById = async (answer_id, question_id) => {

    let query_start = Date.now();
    const answer = await Answer.findOne({
        where: {answer_id, question_id }, 
        include: [
            {
                as: 'attachments',
                model: File
           }
        ]
    });

    let query_end = Date.now();
    var query_elapsed = query_end - query_start;
    sdc.timing('query.answer.get', query_elapsed);

    return answer;

}

module.exports = {findQuestionById, findAllQuestions, findAnswerById};