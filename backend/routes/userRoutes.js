const express = require("express");
const { loginUser, registerUser, getDeliveryUsers } = require("../controllers/userController");
const router = express.Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.get("/delivery", getDeliveryUsers);

module.exports = router;
