const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date },
    type: { type: String },
    variables: { type: String },
    read: { type: Boolean, default: false }

})


module.exports = mongoose.model('Notification', notificationSchema)