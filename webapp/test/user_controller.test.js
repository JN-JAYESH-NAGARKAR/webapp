const app = require('../app');
const supertest = require('supertest');
const bcrypt = require("bcrypt");


describe("GET /authorizeTest",  () => {
    it("Should authorize User", async function() {

      const response = await supertest(app)
      .get('/v1/user/authorizeTest')
      .set('Authorization', 'Basic '+ new Buffer.from("test@test.com:Test@1234").toString("base64"))
      .expect(200);
     
    });

    it("Should not authorize User", async function() {

        const response = await supertest(app)
        .get('/v1/user/authorizeTest')
        .set('Authorization', 'Basic '+ new Buffer.from("testtest.com:Test@1234").toString("base64"))
        .expect(401);
       
      });

      it("Should not authorize User", async function() {

        const response = await supertest(app)
        .get('/v1/user/authorizeTest')
        .set('Authorization', 'Basic '+ new Buffer.from(":Test@1234").toString("base64"))
        .expect(401);
       
      });

      it("Should not authorize User", async function() {

        const response = await supertest(app)
        .get('/v1/user/authorizeTest')
        .set('Authorization', 'Basic '+ new Buffer.from("testtest.com:").toString("base64"))
        .expect(401);
       
      });

});

describe("POST /createTest", () => {
    it("Should create User Successfully", async function() {

        const request = {
            email_address: "test@test.com",
            password: "Test@1234",
            first_name: "test",
            last_name: "test"
          }
    
          const response = await supertest(app)
          .post('/v1/user/createTest')
          .send(request)
          .expect(201);
       
      });

      it("Should not create User, Email Address Not Given", async function() {

        const request = {
            email_address: "",
            password: "Test@1234",
            first_name: "test",
            last_name: "test"
          }
    
          const response = await supertest(app)
          .post('/v1/user/createTest')
          .send(request)
          .expect(400);
       
      });

      it("Should not create User, Invalid Email Address", async function() {

        const request = {
            email_address: "testtest.com",
            password: "Test@1234",
            first_name: "test",
            last_name: "test"
          }
    
          const response = await supertest(app)
          .post('/v1/user/createTest')
          .send(request)
          .expect(400);
       
      });

      it("Should not create User, Invalid Password", async function() {

        const request = {
            email_address: "test@test.com",
            password: "test1234",
            first_name: "test",
            last_name: "test"
          }
    
          const response = await supertest(app)
          .post('/v1/user/createTest')
          .send(request)
          .expect(400);
       
      });
      
});