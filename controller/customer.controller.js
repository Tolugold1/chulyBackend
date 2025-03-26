const Service = require("../service/customer.service");
const { 
  handleResponse
} = require("../utils/helper");

exports.HTTPCreateCustomer = async (req, res, next) => {
  try {
    console.log("body", req.body);
    let body = req.body;
    const data = await Service.createCustomer(body);

    handleResponse({
      res,
      status: 200,
      message: "Client customer created successfully.",
      data,
    });
  } catch (error) {
    console.log("signup error", error);
    next(error);
  }
};


exports.HTTPGetCustomer = async (req, res, next) => {
    try {
      const data = await Service.getCustomer({ 
        businessId: req.params.businessId
      });
  
      handleResponse({
        res,
        status: 200,
        message: "Client customer gotten successfully.",
        data,
      });
    } catch (error) {
      console.log("signup error", error);
      next(error);
    }
};
  
exports.HTTPUpdateCustomer = async (req, res, next) => {
    try {
      let updateData = req.body;
      console.log("updateData", updateData);
      const data = await Service.updateCustomer({
        updateData
      });
  
      handleResponse({
        res,
        status: 200,
        message: "Client customer updated successfully.",
        data,
      });
    } catch (error) {
      console.log("signup error", error);
      next(error);
    }
}

exports.HTTPDeleteCustomer = async (req, res, next) => {
    try {
      let updateData = req.body;
      console.log("updateData", updateData);
      const data = await Service.deleteCustomer({
        businessId: req.body.businessId,
        customerId: req.body.customerId
      });
  
      handleResponse({
        res,
        status: 200,
        message: "Client customer updated successfully.",
        data,
      });
    } catch (error) {
      console.log("signup error", error);
      next(error);
    }
};