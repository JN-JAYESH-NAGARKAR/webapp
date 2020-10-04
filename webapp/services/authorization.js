const auth = require('basic-auth');
const bcrypt = require('bcrypt');

const authorizeAndGetUser = async (req,res, User) => {

    const credentials = auth(req);

    if(!credentials){

        res.status(400).send({
            message: "Please Login!"
        });

    } else {

        let username = credentials.name;
        let password = credentials.pass;

        if(username && password){
            
            let user = await User.findOne({
                where: {
                    username: username
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

            if(typeof username === typeof "" && typeof password === typeof "") {
                res.status(400).send({
                    message: "Please enter Username and Password!"
                });
            }

        }

    }
    
}



module.exports = {authorizeAndGetUser};