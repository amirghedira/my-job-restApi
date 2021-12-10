const Offer = require('../models/Offer')
const Tag = require('../models/Tag')
const City = require('../models/City')
const Country = require('../models/Country')
const User = require('../models/User')
const mongoose = require('mongoose')
const Domain = require('../models/Domain')
const socket = require('socket.io-client')(process.env.HOST)
const Notification = require('../models/Notification')

exports.createOffer = async (req, res) => {
    try {
        const currentClient = await User.findOne({ _id: req.user._id })
        const offerId = mongoose.Types.ObjectId()
        const tags = req.body.offer.tags.map(tag => ({ ...tag, offer: offerId }))
        const createdTags = await Tag.create(tags)
        const createdOffer = await Offer.create({ ...req.body.offer, _id: offerId, date: new Date().toISOString(), tags: createdTags, owner: req.user._id })
        const newNotification = {
            type: 'newOffer',
            date: new Date().toISOString(),
            user: currentClient.owner,
            variables: `{
                offer: { name: ${createdOffer.name}, _id: ${createdOffer._id} },
                client: { name: ${client.name}, _id: ${client._id} },
                date: ${new Date().toISOString()}
            }`
        }
        await Notification.create(newNotification)
        socket.emit('broadcast-notification', { usersIds: currentClient.followers, notification: newNotification })
        res.status(200).json({ offer: createdOffer })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}

exports.applyOffer = async (req, res) => {

    try {

        const currentUser = await User.findOne({ _id: req.user._id })
        const offer = await Offer.findByIdAndUpdate(req.params.offerId, { $addToSet: { applicants: { user: req.user._id, status: 'pending', date: new Date().toISOString() } } })
        const newNotification = {
            type: 'appliedOffer',
            date: new Date().toISOString(),
            user: offer.owner,
            variables: `{
                offer: { name:${offer.name}, _id:${offer._id} },
                user: { firstName:${currentUser.firstName}, lastName:${currentUser.lastName} },
                date: ${new Date().toISOString()}
            }`
        }
        await Notification.create(newNotification)

        socket.emit('send-notification', { userId: offer.owner, notification: newNotification })
        res.status(200).json({ message: 'application successfully sent' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }


}


exports.updateApplicantStatus = async (req, res) => {

    try {
        const offer = await Offer.findOne({ _id: req.params.offerId })
        if (req.user._id != offer.owner)
            return res.status(409).json({ message: 'you dont have access to this resource' })
        const applicantIndex = offer.applicants.findIndex(applicant => applicant.user.toString() == req.params.applicantId.toString())
        console.log(req.body.status == 'accepted')

        if (applicantIndex === -1)
            return res.status(404).json({ message: 'applicant not found' })
        if (req.body.status != 'accepted' && req.body.status != 'rejected')
            return res.status(409).json({ message: 'invalid application status must be (accepted or rejected)' })
        offer.applicants[applicantIndex].status = req.body.status
        let newNotification
        if (req.body.status == 'accepted') {

            newNotification = {
                type: 'acceptedApplication',
                date: new Date().toISOString(),
                user: offer.applicants[applicantIndex].user,
                variables: `{
                    offer: { name:${offer.name}, _id:${offer._id} },
                    date: ${new Date().toISOString()}
                }`
            }

        } else if (req.body.status == 'rejected') {

            newNotification = {
                type: 'rejectedApplication',
                date: new Date().toISOString(),
                user: offer.applicants[applicantIndex].user,
                variables: `{
                    offer: { name:${offer.name}, _id:${offer._id} },
                    date: ${new Date().toISOString()}
                }`
            }

        }
        await Notification.create(newNotification)

        socket.emit('send-notification', { userId: offer.applicants[applicantIndex].user, notification: newNotification })

        await offer.save()
        return res.status(200).json({ message: 'application successfully updated' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }


}

exports.getOffer = async (req, res) => {
    try {
        const offer = await Offer.findOne({ _id: req.params.offerId })
            .populate({
                path: 'city',
                model: 'City',
                populate: {
                    path: 'country',
                    model: 'Country'
                }
            })
            .populate('tags')
            .populate('owner')
            .exec()
        if (!offer)
            return res.status(404).json({ message: 'Offer not found' })

        const tagsNames = offer.tags.map(tag => tag.name).join(' ')
        const offerDomain = await Domain.findOne({ _id: offer.owner.domain })
        const searchedTags = await Tag.find({ name: { $regex: `(?:${tagsNames.split(' ').join('|')})`, $options: 'i' } })
        const searchedTagsId = searchedTags.map(tag => tag._id)
        const searchedCountryCity = await Country.findOne({ cities: { $in: offer.city._id } })

        let relatedOffers = await Offer.find({
            $or: [
                {
                    name: { $regex: `(?:${offer.name.split(' ').join('|')})`, $options: 'i' }
                },
                {
                    owner: offer.owner._id

                },
                {
                    category: { $in: offerDomain.categories }
                },
                {
                    tags: { $in: searchedTagsId }
                },
                {
                    city: { $in: searchedCountryCity.cities }
                }
            ],
        })
            .populate({
                path: 'city',
                model: 'City',
                populate: {
                    path: 'country',
                    model: 'Country'
                }
            })
            .populate('tags')
            .populate('owner')
        relatedOffers = relatedOffers.filter(o => o._id.toString() != offer._id.toString())
        return res.status(200).json({ offer, relatedOffers })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}



exports.getOffers = async (req, res) => {
    try {
        const offers = await Offer.find()
            .populate({
                path: 'city',
                model: 'City',
                populate: {
                    path: 'country',
                    model: 'Country'
                }
            })
            .populate('tags')
            .populate('owner')
            .exec()


        return res.status(200).json({ offers })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}



exports.getOffersBytag = async (req, res) => {
    try {

        const tags = await Tag.find({ name: { $regex: `(?:${req.params.tag.split(' ').join('|')})`, $options: 'i' } })
            .populate('offer')
            .populate({
                path: 'offer',
                model: 'Offer',
                populate: {
                    path: 'city',
                    model: 'City',
                    populate: {
                        path: 'country',
                        model: 'Country'
                    }
                }
            })
            .populate({
                path: 'offer',
                model: 'Offer',
                populate: {
                    path: 'owner',
                    model: 'User'
                }
            })
            .populate({
                path: 'offer',
                model: 'Offer',
                populate: {
                    path: 'tags',
                    model: 'Tag',
                }
            })
        const offers = tags.map(tag => tag.offer)
        res.status(200).json({ offers })

    } catch (error) {
        res.status(500).json({ error: error.message })

    }
}


exports.searchOffer = async (req, res) => {
    try {
        let searchTerm = req.query.searchTerm
        let location = req.query.location
        let searchedCitiesId = [];
        let ownersId
        let domainsId
        let searchedTagsId
        let offers;
        if (location) {
            const searchedCities = await City.find({ name: { $regex: `(?:${location.split(' ').join('|')})`, $options: 'i' } })
            searchedCitiesId = searchedCities.map(city => city._id)
            const searchedCountries = await Country.find({ name: { $regex: `(?:${location.split(' ').join('|')})`, $options: 'i' } })
            searchedCitiesCountries = []
            searchedCountries.forEach(searchedCountry => {
                searchedCountry.cities.forEach(city => {
                    searchedCitiesCountries.push(city)

                })
            })
            searchedCitiesCountries.filter(city => !searchedCitiesId.includes(city))
            searchedCitiesId = [...searchedCitiesId, ...searchedCitiesCountries]

        }

        if (searchTerm) {
            const searchedOwners = await User.find({ name: { $regex: `(?:${searchTerm.split(' ').join('|')})`, $options: 'i' } })
            ownersId = searchedOwners.map(owner => owner._id)
            const searchedDomains = await Domain.find({ name: { $regex: `(?:${searchTerm.split(' ').join('|')})`, $options: 'i' } })
            domainsId = searchedDomains.map(searchedDomain => searchedDomain._id)

            const searchedTags = await Tag.find({ name: { $regex: `(?:${searchTerm.split(' ').join('|')})`, $options: 'i' } })
            searchedTagsId = searchedTags.map(tag => tag._id)
        }

        if (searchTerm && location)
            offers = await Offer.find({
                $or: [
                    {
                        name: { $regex: `(?:${searchTerm.split(' ').join('|')})`, $options: 'i' }
                    },
                    {
                        owner: { $in: ownersId }

                    },
                    {
                        domain: { $in: domainsId }
                    },
                    {
                        tags: { $in: searchedTagsId }
                    }
                ],
                city: { $in: searchedCitiesId }

            })
                .populate({
                    path: 'city',
                    model: 'City',
                    populate: {
                        path: 'country',
                        model: 'Country'
                    }
                })
                .populate('tags')
                .populate('owner')

        else {
            if (searchTerm)
                offers = await Offer.find({
                    $or: [
                        {
                            name: { $regex: `(?:${searchTerm.split(' ').join('|')})`, $options: 'i' }
                        },
                        {
                            owner: { $in: ownersId }

                        },
                        {
                            domain: { $in: domainsId }
                        },
                        {
                            tags: { $in: searchedTagsId }
                        }]
                })
                    .populate({
                        path: 'city',
                        model: 'City',
                        populate: {
                            path: 'country',
                            model: 'Country'
                        }
                    })
                    .populate('tags')
                    .populate('owner')
            else
                offers = await Offer.find({ city: { $in: searchedCitiesId } })
                    .populate({
                        path: 'city',
                        model: 'City',
                        populate: {
                            path: 'country',
                            model: 'Country'
                        }
                    })
                    .populate('tags')
                    .populate('owner')
        }

        res.status(200).json({ offers: offers })


    } catch (error) {
        return res.status(500).json({ error: error });

    }

}



exports.getOffersByFollowers = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user._id })
        const offers = await Offer.find({ owner: { $in: user.followers } })
            .populate({
                path: 'city',
                model: 'City',
                populate: {
                    path: 'country',
                    model: 'Country'
                }
            })
            .populate('tags')
            .populate('owner')
            .exec()


        res.status(200).json({ offers })
    } catch (err) {
        return res.status(500).json({ error: error });

    }
}



exports.updateOffer = async (req, res) => {
    let ops = {};
    for (let obj of req.body) {
        ops[obj.propName] = obj.value;
    }
    try {
        await Offer.updateOne({ _id: req.params.offerId, }, { $set: ops, });
        res.status(200).json({ message: "user updated successfully", });
    } catch (error) {
        res.status(500).json({ message: error.message, });
    }
};



exports.deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findOne({ _id: req.params.offerId })
        if (!offer)
            return res.status(404).json({ message: 'Offer not found' })
        await Tag.deleteMany({ offer: offer._id })
        await Offer.deleteOne({ _id: req.params.offerId })
        return res.status(200).json({ message: 'offer successfully deleted' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}
