const emailValidator = require("email-validator");
const passwordValidator = require("password-validator");
const logger = require('../config/logger');

var schema = new passwordValidator();

schema
.is().min(8)
.is().max(30)
.has().uppercase()
.has().lowercase()
.has().digits()
.has().symbols()
.has().not().spaces()

const validateCategory = category => {
    var regexCategory = /[!@#$%^&*()_\=\[\]{};':"\\|,<>\/?]+/
    if(regexCategory.test(category)){
        return false;
    } else {
        return true;
    }
}

const validateEmail = email => {

    if(emailValidator.validate(email))
        return true;
    else
        return false;
}

const validatePassword = password => {

    let errors = schema.validate(password, { list: true });
    let errorMessagae = []
    errors.forEach(element => {

        if(element == "min"){
            errorMessagae.push('The password must be at least 8 characters long.');
        }
        if(element == "max"){
            errorMessagae.push('The password cannot be more than 30 characters long.');
        }
        if(element == "uppercase"){
            errorMessagae.push('The password must have atleast 1 uppercase character.');
        }
        if(element == "lowercase"){
            errorMessagae.push('The password must have atleast 1 lowercase character.');
        }
        if(element == "symbols"){
            errorMessagae.push('The password must have atleast 1 special character.');
        }
        if(element == "digits"){
            errorMessagae.push('The password must have atleast 1 digit.');
        }
        if(element == "spaces"){
            errorMessagae.push('The password cannot have a space.');
        }

    });
    
    return errorMessagae;
}

const checkIfCategoryEmpty = async (req, res, inputCategories) => {

    for(let i=0; i<inputCategories.length; i++){
        
        let value = inputCategories[i].category;

        if(!value || 0 === value.length){

            res.status(400).send({
                message: "Category Name cannot be empty!"
            });
            logger.error("Category Name cannot be empty..!");
            return false;

        }
    }
    
    return true;
}

module.exports = { validateEmail, validatePassword, validateCategory, checkIfCategoryEmpty};