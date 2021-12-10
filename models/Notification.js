const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date },
    type: { type: String },
    variables: { type: String }


})


module.exports = mongoose.model('Notification', notificationSchema)