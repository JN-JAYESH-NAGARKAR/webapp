const express = require('express');
const answerController = require('../controllers/answer_controller');
const router = express.Router();

//Post a Question's Answer
router.post('/:questionID/', answerController.postAnswer);

//Get a Question's Answer
router.get('/:questionID/answer/:answerID', answerController.getAnswer);

//Delete a Question's Answer
router.delete('/:questionID/answer/:answerID', answerController.deleteAnswer);

//Update a Question's Answer
router.put('/:questionID/answer/:answerID', answerController.updateAnswer);

module.exports = router;