const express = require('express')
const cors = require("cors")
const mongoose = require('mongoose')
const app = express()
const locationApi = require('./routes/location')
const domainApi = require('./routes/domain')
const offerApi = require('./routes/offer')
const userApi = require('./routes/user')
mongoose.connect(process.env.MONGO_INFO, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(res => {
        console.log('connected to database successfully.')
    })
    .catch(err => {
        console.log(err)
    })


const path = require('path')
app.use('/static', express.static(path.join(__dirname, 'assets')))

// Enable CORS
app.use(cors())


// Body parser
app.use(express.urlencoded({ extended: true }))
app.use(express.json())


const { upload } = require('./middleware/awsUpload')

app.post('/upload', upload.array('files', 5), (req, res) => {
    const imagesLinks = req.files.map(file => file.location)
    res.status(200).json(imagesLinks)
})

app.get('/health', (req, res) => {
    res.status(200).send(`my-job backend online`)
})


app.use('/domain', domainApi)
app.use('/user', userApi)
app.use('/offer', offerApi)
app.use('/location', locationApi)


module.exports = app