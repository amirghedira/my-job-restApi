const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema({

    token: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
})


module.exports = mongoose.model('Token', tokenSchema)