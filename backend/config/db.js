require("dotenv").config();

const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
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