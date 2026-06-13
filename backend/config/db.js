const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: "railway", // Temporary hardcoded database name
  port: process.env.MYSQLPORT
});

db.connect((err) => {
  if (err) {
    console.log("Database connection failed");
    console.log(err);
  } else {
    console.log("MySQL Connected");

    db.query("SELECT DATABASE() AS db", (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Current Database:", result);
      }
    });
  }
});

module.exports = db;