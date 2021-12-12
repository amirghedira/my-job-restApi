const Domain = require('../models/Domain')
const Category = require('../models/Category')



exports.getDomains = async (req, res) => {

    try {
        const domains = await Domain.find()
            .populate('categories')
            .exec()
        res.status(200).json({ domains })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}



exports.getDomain = async (req, res) => {

    try {
        const domain = await Domain.findOne({ _id: req.params.domainId })
            .populate('categories')
        if (!domain)
            return res.status(404).json({ message: 'Domain not found' })

        return res.status(200).json({ domain })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}



exports.createDomain = async (req, res) => {

    try {

        const createdDomain = await Domain.create({ name: req.body.name, image: req.file.location })
        res.status(200).json({ domain: createdDomain })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message })
    }

}

exports.updateDomain = async (req, res) => {

    try {

    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}


exports.addDomainCategory = async (req, res) => {

    try {
        const createdCategory = await Category.create(req.body.category)
        await Domain.updateOne({ _id: req.body.category.domain }, { $push: { categories: createdCategory._id } })
        res.status(200).json({ message: 'Category created' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}


exports.removeDomainCategory = async (req, res) => {

    try {
        await Category.deleteOne(req.params.categoryId)
        await Domain.updateOne({ _id: req.body.category.domain }, { $pull: { categories: req.params.categoryId } })
        res.status(200).json({ message: 'Categry deleted' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}



exports.deleteDomain = async (req, res) => {

    try {
        const domain = await Domain.findOne({ _id: req.params.domainId })
        if (!domain)
            return res.status(404).json({ message: 'Domain not found' })

        await Domain.deleteOne({ _id: req.params.domainId })
        return res.status(200).json({ message: 'domain successfully added' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}