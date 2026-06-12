const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {

  const query = req.query.q;

  res.json({
    query,
    results: []
  });

});

module.exports = router;