const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    firstName: { type: String },
    lastName: { type: String },
    name: { type: String },
    description: { type: String },
    birthday: { type: String },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    city: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
    address: { type: String },
    zipCode: { type: String },
    role: { type: String, enum: ['consultant', 'client'], default: 'consultant' },
    joined: { type: Date, require: true },
    domain: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain' },
    status: { type: Boolean, default: true },
    profileImage: { type: String },
    position: {
        latitude: { type: Number },
        longitude: { type: Number }
    },
    skills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
    languages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Language' }],
    savedOffers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }],
    appliedOffers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    notificationToken: { type: String },
    socials: {
        website: { type: String },
        facebook: { type: String },
        instagram: { type: String },
        linkedin: { type: String },
        twitter: { type: String },
    },
})


module.exports = mongoose.model('User', userSchema)
