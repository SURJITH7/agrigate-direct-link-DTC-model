const express = require("express");
const router = express.Router();
const { consumerController } = require("../controllers/index");

// Define your routes here
router.get("/", consumerController);

module.exports = router;
