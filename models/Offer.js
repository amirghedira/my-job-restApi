const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, required: true },
    city: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
    type: { type: String, required: true },
    duration: {
        from: { type: Number },
        to: { type: Number },
        unity: { type: String, enum: ['day', 'month', 'year'] }
    },
    overview: { type: String },
    applicants: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, default: 'pending' }, date: { type: Date }
    }],
    jobDescription: { type: String, required: true },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }

})


module.exports = mongoose.model('Offer', offerSchema)