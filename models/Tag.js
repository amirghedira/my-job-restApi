const mongoose = require('mongoose')

const tagSchema = new mongoose.Schema({
    name: { type: String, required: true },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
})



module.exports = mongoose.model('Tag', tagSchema)