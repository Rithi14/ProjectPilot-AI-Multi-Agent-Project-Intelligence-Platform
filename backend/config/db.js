const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "rithi@123",           // Enter your MySQL password here
  database: "cowork_ai", // Your local database name
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.log("❌ Database connection failed");
    console.log(err);
  } else {
    console.log("✅ MySQL Connected Successfully");

    db.query("SELECT DATABASE() AS db", (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Current Database:", result[0].db);
      }
    });
  }
});

module.exports = db;