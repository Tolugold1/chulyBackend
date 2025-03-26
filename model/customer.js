const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const customerItems = new Schema(
  {
    businessId: {
      type: mongoose.Types.ObjectId,
      ref: "businessProfile",
      index: true,
      required: true,
    },
    name: {
      type: String
    },
    email: { 
        type: String
    },
    address: {
      type: String
    }
  },
  { timestamps: true, versionKey: false }
);

const Customer = mongoose.model("customerItem", customerItems);

module.exports = Customer;
