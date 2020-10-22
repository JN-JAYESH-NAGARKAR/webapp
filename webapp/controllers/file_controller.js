const v4 = require('uuidv4');
const express = require('express');
const db = require('../database/sequelize');
const authorization = require('../services/authorization');
const questionService = require('../services/question_answer');
const answerService = require('../services/question_answer');
const fileService = require('../services/file');
const multer  = require('multer');
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');
const path = require('path');
const User = db.user;
const router = express.Router();
const fs = require('fs');

//setting the credentials
//The region should be the region of the bucket that you created
AWS.config.update({
    
  region: process.env.AWS_REGION

});

//Creating a new instance of S3:
const s3 = new AWS.S3();
const bucket = process.env.AWS_BUCKET_NAME;

// let upload = multer({
//   storage: multerS3({
//       s3: s3,
//       bucket: bucket,
//       contentType: multerS3.AUTO_CONTENT_TYPE,
//       key: function (req, file, cb) {
//           cb(null, file.originalname);
//       }
//   }),
//   limits:{ fileSize: 2000000 }, 
//   fileFilter: function (req, file, cb) {
//     // Allowed Extensions
//     const filetypes = /jpeg|jpg|png/;
//     // Check Extensions
//     const extname = filetypes.test( path.extname( file.originalname ).toLowerCase());
//     // Check Mime Type
//     const mimetype = filetypes.test( file.mimetype );

//     if(mimetype && extname)
//           return cb(null, true);
//       else
//           return cb(new Error('Unsupported File Format'), false);
//   }
// });

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

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        const question = await questionService.findQuestionById(req.params.questionID);

        if(question){

            if(question.user_id === user.id){

                if(!req.file){
                    res.status(400).send({
                        message: 'No File Uploaded!'
                    });
                }
                 
                const filetypes = /jpeg|jpg|png/;
                const extname = filetypes.test( path.extname( req.file.originalname ).toLowerCase());
                const mimetype = filetypes.test( req.file.mimetype );

                
                if(!mimetype && !extname){
                    res.status(400).send({
                        message: 'Unsupported File Type'
                    });
                } else {

                    const fileId = v4.uuid();

                    const fileName = req.params.questionID + "/" + fileId + "/" + path.basename( req.file.originalname, path.extname( req.file.originalname ) ) + path.extname( req.file.originalname);

                    await fileService.questionFileUpload(req.file.path, fileName, s3, question, fileId, req, res);

                }

                fs.unlink(req.file.path, () => {});


                // const imageUpload = upload.single('image');
                // await imageUpload(req, res, async (err, data) => {

                //     if(err){
                //         res.status(400).send({
                //             Error: 'Unsupported File Format'
                //         });
                //     }

                //     if(!req.file){
                //         res.status(400).send({
                //             message: 'No File Uploaded!'
                //         });
                //     }

                //     const params = {
                //         Bucket: process.env.AWS_BUCKET_NAME,
                //         Key: req.file.originalname,
                //     };


                //     const d = await s3.headObject(params).promise();
                //     res.status(200).send(d);

                // });

            } else {

                res.status(401).send({
                    message: "Unauthorized to add image to this question."
                });

            }

        } else {

            res.status(404).send({
                message: "Question doesnot exists!"
            });
        }
    }
});

//Delete a file to Question
router.delete('/:questionID/file/:fileID', async (req, res) => {

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        const question = await questionService.findQuestionById(req.params.questionID);

        if(question){

            if(question.user_id === user.id){

                const file = await question.getAttachments({ where: {file_id: req.params.fileID}});

                if(file.length !== 0){

                    const obFile = file[0];

                    const result = await fileService.questionDeleteFile(obFile, s3, question, res);

                    if(result){

                        res.status(204).send();

                    } else {

                        res.status(500).send({
                            message: err
                         });
                    }

                   
                } else{

                    res.status(404).send({
                        message: "File doesnot exists!"
                    });

                }
                 

            } else {

                res.status(401).send({
                    message: "Unauthorized to delete image to this question."
                });

            }

        } else {

            res.status(404).send({
                message: "Question doesnot exists!"
            });
        }
    }
});


//Attach a file to Answer
router.post('/:questionID/answer/:answerID/file', upload.single('image'), async (req, res) => {

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        const question = await questionService.findQuestionById(req.params.questionID);

        if(question){

            const answer = await answerService.findAnswerById(req.params.answerID, req.params.questionID);

            if(answer){

                if(answer.user_id === user.id){

                    if(!req.file){
                        res.status(400).send({
                            message: 'No File Uploaded!'
                        });
                    }

                    const filetypes = /jpeg|jpg|png/;
                    const extname = filetypes.test( path.extname( req.file.originalname ).toLowerCase());
                    const mimetype = filetypes.test( req.file.mimetype );
    
                    if(!mimetype && !extname){
                        res.status(400).send({
                            message: 'Unsupported File Type'
                        });
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
});

//Delete a file to Answer
router.delete('/:questionID/answer/:answerID/file/:fileID', async (req, res) => {

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        const question = await questionService.findQuestionById(req.params.questionID);

        if(question){

            const answer = await answerService.findAnswerById(req.params.answerID, req.params.questionID);

            if(answer){

                if(answer.user_id === user.id){

                    const file = await answer.getAttachments({ where: {file_id: req.params.fileID}});

                    if(file.length !== 0){

                        const obFile = file[0];

                        const result = await fileService.answerDeleteFile(obFile, s3, answer, req.params.fileID, res);

                        if(result){
                        
                            res.status(204).send();
    
                        } else {
    
                            res.status(500).send({
                                message: err
                             });
                        }

                    } else{

                        res.status(404).send({
                            message: "File doesnot exists!"
                        });

                    }

                } else {

                    res.status(401).send({
                        message: "Unauthorized to delete image to this answer."
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
});

module.exports = {router, s3};