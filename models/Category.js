const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain' },
})

module.exports = mongoose.model('Category', categorySchema)