var express = require('express');
var router = express.Router();
const bodyParser = require("body-parser");
router.use(bodyParser.json());
var authenticate = require("../authentication.js");
const controller = require("../controller/customer.controller.js")

router.post("/create-customer",  authenticate.authenticateJWT,  controller.HTTPCreateCustomer)

router.get("/get-customer/:businessId", authenticate.authenticateJWT, controller.HTTPGetCustomer)

router.put("/update-customer", authenticate.authenticateJWT, controller.HTTPUpdateCustomer)

router.delete("/delete-customer", authenticate.authenticateJWT, controller.HTTPDeleteCustomer)

module.exports = router;
