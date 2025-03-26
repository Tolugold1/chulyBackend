const Customer = require("../model/customer");
const {
    ForbiddenError,
    NotFoundError,
} = require("../utils/error");

/**
 * Create a new client profile.
 * @param {Object} profileData - The profile details.
 * @returns {Promise<Object>}
 */
exports.createCustomer = async (profileData) => {
    try {
        console.log("profileData", profileData);
        const newCustomer = new Customer(profileData);
        await newCustomer.save();
        const customers = await Customer.find({businessId: profileData.businessId });
        return customers;
    } catch (error) {
        throw error;
    }
}

/**
 * Get a client profile by userId.
 * @param {String} businessId - The ID of the user.
 * @returns {Promise<Object>}
 */
exports.getCustomer = async ({businessId}) => {
    try {
        let customer = await Customer.find({ businessId });
        if (customer == null) {
            throw NotFoundError("No customer found");
        }
        return customer;
    } catch (error) {
        console.log("error", error);
        throw error;
    }
}

/**
 * Update a client profile.
 * @param {String} businessId - The ID of the user.
 * @param {Object} updateData - The fields to update.
 * @returns {Promise<Object>}
 */
exports.updateCustomer = async ({ updateData }) => {
    try {
        let customer = await Customer.findOne({ _id: updateData?.customerId });
        if (!customer) throw ForbiddenError("Customer does not exist");
        customer.name = updateData.name;
        customer.email = updateData.email;
        customer.address = updateData.address;
        await customer.save();
        const customers = await Customer.find({businessId: updateData.businessId });
        return customers;
    } catch (error) {
        throw error;
    }
}

/**
 * Delete a client profile.
 * @param {String} businessId - The ID of the user.
 * @param {Object} updateData - The fields to update.
 * @returns {Promise<Object>}
 */
exports.deleteCustomer = async ({customerId, businessId}) => {
    try {
        await Customer.deleteOne({ _id: customerId });
        let customers = await Customer.find({ businessId });
        return customers;
    } catch (error) {
        throw error;
    }
}