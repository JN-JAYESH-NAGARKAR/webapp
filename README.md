# CSYE 6225 - Fall 2020 

## Technology Stack
* Backend Technology: Node JS
* Framework: Express
* Database: MySQL

## Build Instructions
* Clone this repository 

    ```sh
    $ git clone git@github.com:gamitd-fall2020/webapp.git
    ```

* Navigate to webapp directory

    ```sh
    $ cd webapp
    ```

* Run command on terminal to install all the required dependencies

    ```sh
    $ npm install 
    ```

## Deploy Instructions

* Create Enviornment File

    ```sh
    $ export PORT={PORT_NUMBER}
    $ export DB_HOST={HOST_NAME}
    $ export DB_USER={DATABASE_USERNAME}
    $ export DB_PASSWORD={DATABASE_PWD}
    $ export DB_NAME={DATABASE_SCHEMA_NAME}
    ```

* To start Application

    ```sh
    $ npm start
    ```
    
* Test api endpoint using Postman or other.

## Running Tests
* To run Test 

    ```sh
    $ npm run test
    ```
