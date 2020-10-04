const uuidv4 = require('uuidv4');
const db = require('../database/sequelize');
const validator = require('../services/validator');
const authorization = require('../services/authorization');
const bcrypt = require('bcrypt');
const auth = require('basic-auth');
const User = db.user;


exports.createUser = async (req, res) => {

    let username = req.body.username;
    let password = req.body.password;
    let first_name = req.body.first_name;
    let last_name = req.body.last_name;

    if(username && password && first_name && last_name){
        if(validator.validateEmail(username)){

            let alreadyExists = await User.findOne({ where: {username: username}});
            if(alreadyExists != null){

                res.status(409).send({
                    message: "User already exists."
                });

            } else {

                let passwordErrors = await validator.validatePassword(password);
                if(passwordErrors.length != 0){

                    res.status(400).send({
                        message: passwordErrors
                    });

                } else {

                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(password,salt);

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
                        })
                        .catch(err => {

                            res.status(500).send({
                                message: err.message || "Some error occurred while creating the User."
                            });
                        });
                }
            }

        } else {

            res.status(400).send({
                message: "Invalid Username."
            });
        }
        
    } else {

        res.status(400).send({
            message: "Please Enter all fields Username, Password, First_Name, Last_Name."
        });
    }
}

exports.getUser = async (req, res) => {

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        user = user.toJSON();
        delete user.password;
        res.status(200).send(user);

    }
    
}

exports.updateUser = async (req, res) => {

    let password = req.body.password;
    let first_name = req.body.first_name;
    let last_name = req.body.last_name;

    let user = await authorization.authorizeAndGetUser(req, res, User);

    if(user){

        if(req.body.username || req.body.account_updated || req.body.account_created){

            res.status(400).send({
                message: "Cannot update Username, Account Updated & Account_Created field."
            });
        } else if(!password && !first_name && !last_name){
    
            res.status(400).send({
                message: "Atleast one field required to update."
            });
        } else {

            if(!password){

                if(typeof password === typeof ""){
                    
                    res.status(400).send({
                        message: "Password cannot be empty!"
                    });
                    return;
                } 
            } else {

                    let passwordErrors = await validator.validatePassword(password);
                    if(passwordErrors.length != 0){
                        res.status(400).send({
                            message: passwordErrors
                        })
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

                    return;
    
                } 
            } else {

                user.last_name = last_name;

            }
        
            await user.save();
            res.status(204).send({
                message: "Updated Successfully."
            });

        }

    }

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




