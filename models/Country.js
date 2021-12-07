const mongoose = require('mongoose')

const countrySchema = new mongoose.Schema({
    name: { type: String, required: true },
    cities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'City' }],
})


module.exports = mongoose.model('Country', countrySchema)