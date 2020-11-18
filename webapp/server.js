const app = require('./app');
const logger = require('./config/logger');

// Database Connection
const db = require("./database/sequelize");
db.sequelize.sync({ force: false }).then(() => {
    console.log(`Database Connected.`);
    logger.info("Database Connected...");
});

// Set port, Listen for Requests
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
  logger.info("Server Started...");
});