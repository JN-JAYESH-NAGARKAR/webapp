const express = require('express');
const questionController = require('../controllers/question_controller');
const router = express.Router();

//Post a Question
router.post('/', questionController.createQuestion);

//Get a Question
router.get('/:questionID', questionController.getAQuestion);

//Delete a Question
router.delete('/:questionID', questionController.deleteAQuestion);

//Update a Question
router.put('/:questionID', questionController.updateAQuestion);

module.exports = router;