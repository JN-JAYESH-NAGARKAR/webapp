const auth = require('basic-auth');
const bcrypt = require('bcrypt');
const db = require('../database/sequelize');


const authorizeAndGetUser = async (req,res, User) => {

    const credentials = auth(req);

    if(!credentials){

        res.status(400).send({
            message: "Please Login!"
        });

    } else {

        let email = credentials.name;
        let password = credentials.pass;

        if(email && password){
            
            let user = await User.findOne({
                where: {
                    email_address: email
                }
            });

            if(!user){

                res.setHeader('WWW-Authentication', 'Basic realm = "example"');
                res.status(401).send({
                    Unauthorized: "Username doesn't exists"
                });

            } else {

                if(! await bcrypt.compare(password, user.password)){
                    res.setHeader('WWW-Authentication', 'Basic realm = "example"');
                    res.status(401).send({
                        Unauthorized: "Invalid Credentials"
                    });

                } else {

                    return user;

                }
            }
        } else {

            if(typeof email === typeof "" && typeof password === typeof "") {
                res.status(400).send({
                    message: "Please enter Username and Password!"
                });
            }

        }

    }
    
}



module.exports = {authorizeAndGetUser};