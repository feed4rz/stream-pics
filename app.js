const config = require('./config.json')
const mongoose = require('mongoose')
const express = require('express')
const bodyparser = require('body-parser')

/* Mongoose connect */
mongoose.connect(`mongodb://localhost/${config.db_name}`)

const db = mongoose.connection

db.on('error', console.error.bind(console, 'Database:'))

db.on('disconnected', () => {
  console.error('Database: Disconnected')
})

db.once('open', () => {
  console.log('Database: connected')
})

process.on('SIGINT', () => {
  db.close(() => {
    console.log('Database: Manually Disconnected')
    process.exit(0)
  })
})

const Pic = mongoose.model('Pic', new mongoose.Schema({
	url: String
}))

const app = express()

app.use(bodyparser.json())

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html')
})

app.get('/panel/:password', (req, res) => {
	if(req.params.password != config.password) return res.send('Incorrect password')

	res.sendFile(__dirname + '/panel.html')
})

app.post('/pic/get', async(req, res) => {
	try {
		const pics = await Pic.find()

		if(!pics.length) return res.json({ success: false, err: 'No pics found in db' })

		const num = Math.floor(Math.random() * pics.length)
		const pic = pics[num]

		res.json({ success: true, response: { pic } })
	} catch(err) {
		res.json({ success: false, err: 'Internal server error' })
	}
})

app.post('/pic/remove', async(req, res) => {
	const { password, _id } = req.body

	if(!password) return res.json({ success: false, err: 'password is invalid' })
	if(password != config.password) return res.json({ success: false, err: 'password is invalid' })
	if(!_id) return res.json({ success: false, err: 'id is invalid' })

	try {
		const pic = await Pic.remove({ _id })

		if(!pic) return res.json({ success: false, err: 'No pic was found' })

		res.json({ success: true, response: { pic } })
	} catch(err) {
		res.json({ success: false, err: 'Internal server error' })
	}
})

app.post('/pic/all', async(req, res) => {
	const { password } = req.body

	if(!password) return res.json({ success: false, err: 'password is invalid' })
	if(password != config.password) return res.json({ success: false, err: 'password is invalid' })

	try {
		const pics = await Pic.find()

		res.json({ success: true, response: { pics } })
	} catch(err) {
		res.json({ success: false, err: 'Internal server error' })
	}
})

app.post('/pic/add', async(req, res) => {
	const { url, password } = req.body

	if(!password) return res.json({ success: false, err: 'password is invalid' })
	if(password != config.password) return res.json({ success: false, err: 'password is invalid' })
	if(!url) return res.json({ success: false, err: 'url is invalid' })

	try {
		const pic = await Pic.create({ url })

		res.json({ success: true, response: { pic } })
	} catch(err) {
		res.json({ success: false, err: 'Internal server error' })
	}
})

app.listen(config.express_port)

console.log('Express:', 'running on port', config.express_port)