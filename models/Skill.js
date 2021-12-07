const mongoose = require('mongoose')

const skillSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rate: { type: Number, default: 0 }
})


module.exports = mongoose.model('Skill', skillSchema)