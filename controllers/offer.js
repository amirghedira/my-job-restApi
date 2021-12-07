const Offer = require('../models/Offer')
const Tag = require('../models/Tag')
const City = require('../models/City')
const Country = require('../models/Country')
const User = require('../models/User')
const mongoose = require('mongoose')
const Domain = require('../models/Domain')

exports.createOffer = async (req, res) => {
    try {
        const offerId = mongoose.Types.ObjectId()
        const tags = req.body.offer.tags.map(tag => ({ ...tag, offer: offerId }))
        const createdTags = await Tag.create(tags)
        const createdOffer = await Offer.create({ ...req.body.offer, _id: offerId, date: new Date().toISOString(), tags: createdTags, owner: req.user._id })
        res.status(200).json({ offer: createdOffer })
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
