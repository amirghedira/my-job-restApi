const User = require('../models/User')
const Token = require('../models/Token')
const Domain = require('../models/Domain')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Skill = require('../models/Skill')
const City = require('../models/City')
const Country = require('../models/Country')
const Offer = require('../models/Offer')
const mongoose = require('mongoose')
const socket = require('socket.io-client')(process.env.HOST)
const Notification = require('../models/Notification')

exports.createUser = async (req, res) => {
    try {
        const user = await User.findOne({
            $or: [
                {
                    email: req.body.email.toLowerCase(),
                },
                {
                    phone: req.body.phone,
                },
            ],
        });
        if (user) {
            res.status(409).json({
                message: "user already exists",
            });
        } else {
            const hashedPass = await bcrypt.hash(req.body.password, 11);
            const userId = mongoose.Types.ObjectId()
            if (!req.body.profileImage)
                req.body.profileImage = `https://avatars.dicebear.com/api/initials/${req.body.name || req.body.firstName}.svg`
            let createdSkills = []
            if (req.body.role === 'consultant' && req.body.skills) {
                createdSkills = await Skill.create(req.body.skills.map(skill => {
                    return {
                        ...skill,
                        user: userId
                    }
                }))
            }
            const createdUser = await User.create({ ...req.body, _id: userId, password: hashedPass, joined: new Date().toISOString(), skills: createdSkills })
            await Domain.updateOne({ _id: req.body.domain }, { $push: { users: createdUser._id } })
            const payload = {
                _id: createdUser._id,
                email: createdUser.email,
                phone: createdUser.phone
            };
            res.status(200).json({ user: createdUser });
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
};



exports.userLogin = async (req, res) => {
    try {
        const user = await User.findOne({
            $or: [
                {
                    email: req.body.identifier.toLowerCase(),
                },
                {
                    phone: req.body.identifier,
                },
            ],
        }).exec();
        if (user) {
            const result = await bcrypt.compare(req.body.password, user.password);
            if (!result) {
                const payload = { _id: user._id, email: user.email }
                const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, {
                    expiresIn: "1h",
                });
                const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_KEY);
                await Token.create({
                    token: refreshToken,
                    user: user._id,
                });

                res.status(200).json({ accessToken });
            } else {
                res.status(400).json("Auth failed");
            }
        } else {
            res.status(400).json("Auth failed");
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};

exports.addSavedOffer = async (req, res) => {
    try {
        const offerId = req.body.offerId
        const isValidId = mongoose.Types.ObjectId.isValid(offerId)
        if (isValidId) {
            const offer = await Offer.findOne({ _id: offerId })
            if (offer) {
                await User.updateOne({ _id: req.user._id }, { $push: { savedOffers: offer } })
                return res.status(200).json({ message: 'offer successfully saved' })
            }
        }
        return res.status(404).json({ message: 'Offer not found' })


    } catch (error) {
        res.status(500).json({ error: error })
    }
}



exports.followClient = async (req, res) => {
    try {
        const client = await User.findOne({ _id: req.body.clientId })
        const currentUser = await User.findOne({ _id: req.user._id })
        if (client) {

            await User.updateOne({ _id: client._id }, { $push: { followers: req.user._id } })
            return res.status(200).json({ message: 'successfully followed client' })
        }
        const newNotification = {
            type: 'following',
            date: new Date().toISOString(),
            user: client._id,
            variables: `{
                user: {_id:${currentUser._id}, firstName: ${currentUser.firstName}, lastName: ${currentUser.lastName},profileImage:${currentUser.profileImage} },
                date: ${new Date().toISOString()}
            }`
        }
        await Notification.create(newNotification)

        socket.emit('send-notification', { userId: client._id, notification: newNotification })
        return res.status(404).json({ message: 'Client not found' })
    } catch (error) {
        res.status(500).json({ error: error })

    }
}


exports.addUserSkill = async (req, res) => {
    try {
        const skill = await Skill.create({ ...req.body.skill, user: req.user._id })
        await User.updateOne({ _id: req.user._id }, { $push: { skills: skill._id } })
        res.status(200).json({ message: 'skill successfully added' })

    } catch (error) {
        res.status(500).json({ message: error.message });

    }
}



exports.getConnectedUser = async (req, res) => {
    try {
        console.log('heyyyyy')

        const user = await User.findOne({ _id: req.user._id })
            .populate({
                path: 'savedOffers',
                model: 'Offer',
                populate: {
                    path: 'city',
                    model: 'City',
                    populate: {
                        path: 'country',
                        model: 'Country'
                    }
                },
            })
            .populate({
                path: 'savedOffers',
                model: 'Offer',
                populate: {
                    path: 'owner',
                    model: 'User'
                },
            })
            .populate({
                path: 'savedOffers',
                model: 'Offer',
                populate: {
                    path: 'tags',
                    model: 'Tag'
                },
            })
            .populate({
                path: 'city',
                model: 'City',
                populate: {
                    path: 'country',
                    model: 'Country'
                }
            })
            .populate('domain')
            .populate({
                path: 'domain',
                model: 'Domain',
                populate: {
                    path: 'categories',
                    model: 'Category'
                }
            })
            .populate('skills')
            .exec()
        const userNotifications = await Notification.find({ user: req.user._id })
        res.status(200).json({ connectedUser: user, notifications: userNotifications })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });

    }
}




exports.verifyUser = async (req, res) => {
    try {
        const userPayload = jwt.verify(
            req.params.token,
            process.env.ACCESS_TOKEN_KEY
        );
        const user = await User.findOne({
            _id: userPayload._id,
        });
        if (user) {
            if (!user.confirmed) {
                user.confirmed = true;
                await user.save();
            }
            res.status(200).json({
                message: "user verified",
                email: user.email,
            });
        } else
            res.status(404).json({
                message: "user not found",
            });
    } catch (error) {
        console.log(error);
        res.status(400).json({
            message: "invalid token",
        });
    }
};


exports.getConsultant = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.userId }).
            populate({
                path: 'savedOffers',
                model: 'Offer',
                populate: {
                    path: 'tags',
                    model: 'Tag'
                },
            })
            .populate({
                path: 'city',
                model: 'City',
                populate: {
                    path: 'country',
                    model: 'Country'
                }
            })
            .populate('skills')
            .populate('languages')
            .exec()

        if (!user)
            return res.status(404).json({ message: 'User not found' })
        return res.status(200).json({ user })
    } catch (error) {
        res.status(500).json({ error: error.message })
        console.log(error)
    }

}


exports.getClient = async (req, res) => {
    try {
        const client = await User.findOne({ _id: req.params.userId }).populate('domain').populate({
            path: 'city',
            model: 'City',
            populate: {
                path: 'country',
                model: 'Country'
            }
        }).exec()


        if (!client)
            return res.status(404).json({ message: 'User not found' })

        const offers = await Offer.find({ owner: client._id })
            .populate({
                path: 'city',
                model: 'City',
                populate: {
                    path: 'country',
                    model: 'Country'
                }
            })
            .populate('category')
            .populate('tags')
        return res.status(200).json({ offers, client })
    } catch (error) {
        res.status(500).json({ error: error.message })
        console.log(error)
    }

}

exports.markNotificationsAsRead = async (req, res) => {

    try {
        await Notification.updateMany({ user: req.user._id }, { $set: { read: true } })
        res.status(200).json({ message: 'notifications successfully readed' });
    } catch (error) {
        res.status(500).json({ error: error });
    }
}

exports.updateUserInfo = async (req, res) => {
    try {
        const updateOps = {};
        for (const ops of req.body) {
            updateOps[ops.propName] = ops.value;
        }
        await User.updateOne(
            { _id: req.user._id },
            { $set: updateOps },
        );
        res.status(200).json({ message: 'Updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error });
    }
}




exports.updateUserPassword = async (req, res) => {
    try {

        const user = await User.findOne({ _id: req.user._id });
        if (!user) {
            res.status(401).json({ message: 'Invalid user.' });
        } else {
            let isValid = await bcrypt.compare(req.body.password, user.password);
            if (!isValid) {
                res.status(401).json({ message: 'Invalid password.' });
            } else {
                hashedPassword = await bcrypt.hash(req.body.newPassword, 11);
                user.password = hashedPassword;
                await user.save();
                res.status(200).json({ message: 'Password updated Successfully!' });
            }
        }
    } catch (error) {
        res.status(500).json({ error: error });
    }
};



exports.userLogout = async (req, res) => {
    try {
        await Token.deleteOne({
            user: req.user._id,
        });
        res.status(200).json({
            message: "user logged out",
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.updateUserSkill = async (req, res) => {
    try {
        await Skill.updateOne({ _id: req.params.skillId, user: req.user._id }, { $set: { name: req.body.name, rate: req.body.rate } })
        res.status(200).json({ message: 'skill successfully updated' })
    } catch (error) {
        res.status(500).json({ message: error.message });

    }
}



exports.getConsultantsBySkills = async (req, res) => {
    try {

        const skills = await Skill.find({ name: { $regex: `(?:${req.params.skill.split(' ').join('|')})`, $options: 'i' } })
            .populate('user')
            .populate({
                path: 'user',
                model: 'User',
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
                path: 'user',
                model: 'User',
                populate: {
                    path: 'domain',
                    model: 'Domain',
                }
            })
            .populate({
                path: 'user',
                model: 'User',
                populate: {
                    path: 'skills',
                    model: 'Skill',
                }
            })
        const consultants = skills.map(skill => skill.user)

        res.status(200).json({ consultants })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message })

    }
}



exports.updateAccessToken = async (req, res) => {
    try {
        if (req.body.accessToken == null) {
            return res.status(403).json({
                message: "access denied",
            });
        }

        const decodedUser = jwt.decode(req.body.accessToken);
        const refreshToken = await Token.findOne({ user: decodedUser._id }).populate('user').exec();

        if (refreshToken) {
            const payload = {
                _id: refreshToken.user._id,
                email: refreshToken.user.email
            };
            const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, {
                expiresIn: "1h",
            });

            return res.status(200).json({
                accessToken,
            });
        }
        return res.status(403).json({
            message: "access denied",
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: error });
    }
};

exports.searchConsultant = async (req, res) => {
    try {
        let searchTerm = req.query.searchTerm
        let location = req.query.location
        let searchedCitiesId = [];
        let searchedDomainsId = []
        let searchedSkillsId = []
        let users;
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
            const searchedDomains = await Domain.find({ name: { $regex: `(?:${searchTerm.split(' ').join('|')})`, $options: 'i' } })
            searchedDomainsId = searchedDomains.map(searchedDomain => searchedDomain._id)
            const searchedSkills = await Skill.find({ name: { $regex: `(?:${searchTerm.split(' ').join('|')})`, $options: 'i' } })
            searchedSkillsId = searchedSkills.map(searchedSkill => searchedSkill._id)

        }
        if (searchTerm && location)
            users = await User.find({
                role: 'consultant',
                $or: [
                    {
                        firstName: { $regex: `(?:${searchTerm.split(' ').join('|')})`, $options: 'i' }
                    },
                    {
                        lastName: { $regex: `(?:${searchTerm.split(' ').join('|')})`, $options: 'i' }

                    },
                    {
                        domain: { $in: searchedDomainsId }
                    },
                    {
                        skills: { $in: searchedSkillsId }
                    },
                ],
                city: { $in: searchedCitiesId }
            }).populate({
                path: 'city',
                model: 'City',
                populate: {
                    path: 'country',
                    model: 'Country'
                }
            }).populate('domain').populate('skills').exec()
        else {
            if (searchTerm)
                users = await User.find({
                    $or: [
                        {
                            firstName: { $regex: `(?:${searchTerm.split(' ').join('|')})`, $options: 'i' }
                        },
                        {
                            lastName: { $regex: `(?:${searchTerm.split(' ').join('|')})`, $options: 'i' }

                        },
                        {
                            domain: { $in: searchedDomainsId }
                        },
                        {
                            skills: { $in: searchedSkillsId }
                        },
                    ]
                }).populate({
                    path: 'city',
                    model: 'City',
                    populate: {
                        path: 'country',
                        model: 'Country'
                    }
                }).populate('domain').populate('skills').exec()

            else
                users = await User.find({ city: { $in: searchedCitiesId } }).populate({
                    path: 'city',
                    model: 'City',
                    populate: {
                        path: 'country',
                        model: 'Country'
                    }
                }).populate('domain').populate('skills').exec()

        }
        res.status(200).json({ users: users })


    } catch (error) {
        return res.status(500).json({ error: error });

    }

}

exports.deleteSavedOffer = async (req, res) => {
    try {
        const offer = await Offer.findOne({ _id: req.params.offerId })
        if (offer) {
            await User.updateOne({ _id: req.user._id }, { $pull: { savedOffers: offer._id } })
            return res.status(200).json({ message: 'offer successfully deleted' })
        }
        return res.status(404).json({ message: 'Offer not found' })


    } catch (error) {
        res.status(500).json({ error: error })
    }
}


exports.unFollowClient = async (req, res) => {
    try {

        const client = await User.findOne({ _id: req.params.clientId })
        if (client) {

            await User.updateOne({ _id: req.user._id }, { $pull: { followers: req.params.clientId } })
            return res.status(200).json({ message: 'successfully unfollowed client' })
        }
        return res.status(404).json({ message: 'Client not found' })
    } catch (error) {
        res.status(500).json({ error: error })

    }
}



exports.deleteUserSkill = async (req, res) => {

    try {
        await Skill.deleteOne({ _id: req.params.skillId })
        await User.updateOne({ _id: req.user._id }, { $pull: { skills: req.params.skillId } })
        res.status(200).json({ message: 'skill successfully deleted' })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}








