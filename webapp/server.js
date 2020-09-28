const app = require('./app');

// Database Connection
const db = require("./database/sequelize");
db.sequelize.sync({ force: true }).then(() => {
    console.log(`Database Connected.`);
});

// Set port, Listen for Requests
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});