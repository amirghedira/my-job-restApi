const express = require('express')
const cors = require("cors")
const mongoose = require('mongoose')
const app = express()


mongoose.connect(process.env.MONGO_INFO, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(res => {
        console.log('connected to database successfully.')
    })
    .catch(err => {
        console.log(err)
    })

// Enable CORS
app.use(cors())
// Body parser
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get('/health', (req, res) => {
    res.status(200).send(`my-job backend online`)
})