const uuidv4 = require('uuidv4');
const bcrypt = require('bcrypt');
const auth = require('basic-auth');
const SDC = require('statsd-client');
const db = require('../database/sequelize');
const validator = require('../services/validator');
const authorization = require('../services/authorization');
const logger = require('../config/logger');
const dbConfig = require("../config/db.config.js");
const User = db.user;

const sdc = new SDC({host: dbConfig.METRICS_HOSTNAME, port: dbConfig.METRICS_PORT});


exports.createUser = async (req, res) => {

    let start = Date.now();
    logger.info("User CREATE Call");
    sdc.increment('endpoint.user.http.post');

    let username = req.body.username;
    let password = req.body.password;
    let first_name = req.body.first_name;
    let last_name = req.body.last_name;

    if(username && password && first_name && last_name){
        if(validator.validateEmail(username)){

            let query_start_1 = Date.now();

            let alreadyExists = await User.findOne({ where: {username: username}});

            let query_end_1 = Date.now();
            let query_elapsed_1 = query_end_1 - query_start_1;
            sdc.timing('query.user.get', query_elapsed_1);

            if(alreadyExists != null){

                res.status(409).send({
                    message: "User already exists."
                });

                logger.error("User already exists..!");

            } else {

                let passwordErrors = await validator.validatePassword(password);
                if(passwordErrors.length != 0){

                    res.status(400).send({
                        message: passwordErrors
                    });

                    logger.error("Password is not valid");

                } else {

                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(password,salt);

                    let query_start = Date.now();

                    const user = {

                        id: uuidv4.uuid(),
                        first_name: first_name,
                        last_name: last_name,
                        password: hashedPassword,
                        username: username
                    };
    
                    User.create(user)
                        .then(data => {

                            let temp = data.toJSON();
                            delete temp.password;
                            res.status(201).send(temp);

                            logger.info("User has been created..!");
                        })
                        .catch(err => {

                            res.status(500).send({
                                message: err.message || "Some error occurred while creating the User."
                            });
                            logger.error(err.message);
                        });

                        let query_end = Date.now();
                        let query_elapsed = query_end - query_start;
                        sdc.timing('query.user.create', query_elapsed);
                }
            }

        } else {

            res.status(400).send({
                message: "Invalid Username."
            });
            logger.error("Username is not valid..!");
        }
        
    } else {

        res.status(400).send({
            message: "Please Enter all fields Username, Password, First_Name, Last_Name."
        });
        logger.error("Incomplete Information..!");
    }

    let end = Date.now();
    var elapsed = end - start;
    sdc.timing('timer.user.http.post', elapsed);
}

exports.getUser = async (req, res) => {

    let start = Date.now();
    logger.info("User SELF Call");
    sdc.increment('endpoint.self.http.get');
    
    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        logger.info("User Authorized..!");

        user = user.toJSON();
        delete user.password;
        res.status(200).send(user);

        logger.info("Self Information Retrived..!");
    }   

    let end = Date.now();
    var elapsed = end - start;
    sdc.timing('timer.self.http.get', elapsed);
}

exports.updateUser = async (req, res) => {

    let start = Date.now();
    logger.info("User UPDATE Call");
    sdc.increment('endpoint.user.http.put');

    let password = req.body.password;
    let first_name = req.body.first_name;
    let last_name = req.body.last_name;

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        logger.info("User Authorized..!");

        if(req.body.username || req.body.account_updated || req.body.account_created){

            res.status(400).send({
                message: "Cannot update Username, Account Updated & Account_Created field."
            });
            logger.error("Non Updateable Fields Entered..!");

        } else if(!password && !first_name && !last_name){
    
            res.status(400).send({
                message: "Atleast one field required to update."
            });
            logger.error("Incomplete Information..!");

        } else {

            if(!password){

                if(typeof password === typeof ""){
                    
                    res.status(400).send({
                        message: "Password cannot be empty!"
                    });
                    logger.error("Password cannot be empty..!");
                    return;
                } 
            } else {

                    let passwordErrors = await validator.validatePassword(password);
                    if(passwordErrors.length != 0){
                        res.status(400).send({
                            message: passwordErrors
                        })
                        logger.error("Password is not valid..!");
                    } else {
                        const hashedPassword = await bcrypt.hash(password,10);
                        user.password = hashedPassword;
                    }
            }

            if(!first_name){

                if(typeof first_name === typeof ""){

                    res.status(400).send({
                        message: "First Name cannot be empty!"
                    });
                    logger.error("First Name cannot be empty..!");
                    return;
    
                } 
            } else {

                user.first_name = first_name;

            }

            if(!last_name){

                if(typeof last_name === typeof ""){

                    res.status(400).send({
                        message: "Last Name cannot be empty!"
                    });
                    logger.error("Last Name cannot be empty..!");
                    return;
    
                } 
            } else {

                user.last_name = last_name;

            }
        
            let query_start = Date.now();
            await user.save();
            let query_end = Date.now();
            let query_elapsed = query_end - query_start;
            sdc.timing('query.user.save', query_elapsed);

            res.status(204).send({
                message: "Updated Successfully."
            });

            logger.info("User Information has been updated..!");
        }
    }

    let end = Date.now();
    var elapsed = end - start;
    sdc.timing('timer.user.http.put', elapsed);

}

exports.getUserInfo = async (req, res) => {

    let start = Date.now();
    logger.info("User GET Call");
    sdc.increment('endpoint.user.http.get');

    let query_start = Date.now();
    let user = await User.findOne({
        where: {
            id: req.params.id
        }
    });
    let query_end = Date.now();
    let query_elapsed = query_end - query_start;
    sdc.timing('query.user.get', query_elapsed);

    if(user){

        logger.info("User Found..!");

        user = user.toJSON();
        delete user.password;
        res.status(200).send(user);

        logger.info("User Information Retrived..!");
        
    } else {
        res.status(404).send({
            message: "User doesnot exists!"
        });
        logger.error("User doesnot exists..!");
    }

    let end = Date.now();
    var elapsed = end - start;
    sdc.timing('timer.user.http.get', elapsed);
}

//Mock Functions

exports.authorizeTest = (req, res) => {

    const credentials = auth(req);
    if (!credentials || !validator.validateEmail(credentials.name || !credentials.name || !credentials.pass)) {

        res.setHeader('WWW-Authenticate', 'Basic realm="example"');
        res.status(401).send({
            message: "Authorization Failed!!"
        });
    }
    else {

        res.status(200).send({
            message: "Authorization Successfull!!"
        });
    }  
}

exports.creationTest = async (req, res) => {

    let email_address = req.body.email_address;
    let password = req.body.password;
    let first_name = req.body.first_name;
    let last_name = req.body.last_name;

    if(email_address && password && first_name && last_name){
        if(validator.validateEmail(email_address)){

            let passwordErrors = await validator.validatePassword(password);
            if(passwordErrors.length != 0){

                res.status(400).send({
                    message: "Invalid Password"
                });

            } else {

                res.status(201).send({
                    message: "User created successfully.",
                });
            }

        } else {

            res.status(400).send({
                message: "Invalid Email Address."
            });
        }   

    } else {

        res.status(400).send({
            message: "Please Enter all fields Email_Address, Password, First_Name, Last_Name."
        });
    }
}
