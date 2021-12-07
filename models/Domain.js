const mongoose = require('mongoose')

const DomainSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }]
})

module.exports = mongoose.model('Domain', DomainSchema)