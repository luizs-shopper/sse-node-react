const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.get('/status', (request, response) => response.json({clients: clients.length}))

const PORT = 3000

let clients = []
let facts = []

function eventsHandler(request, response, next) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  }
  response.writeHead(200, headers)

  const data = `data: ${JSON.stringify(facts)}\n\n`

  response.write(data)

  const clientId = request.query.clientId

  const newClient = {
    id: clientId,
    response
  }

  clients.push(newClient)

  request.on('close', () => {
    console.log(`${clientId} Connection closed`)
    clients = clients.filter(client => client.id !== clientId)
  })
}

app.get('/events', eventsHandler)

function sendEvent(clientId, event) {
  const client = clients.find(client => client.id=== clientId)
  client.response.write(`data: ${JSON.stringify(event)}\n\n`)
}

async function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

async function doTheJob(clientId, parameter) {
  let complete = false
  const loops = Math.round(Math.random() * 100)
  for(let i = 0; i < loops; i += 1) {
    let now = Date.now()
    if (i + 1 === loops) complete = true
    sendEvent(clientId, { parameter, now, complete, current: i + 1, total: loops })
    await sleep(Math.random() * 1000)
  }
}

function startJob(request, response, next) {
  const clientId = request.query.clientId
  const { parameter } = request.body
  console.log(`Started job ${parameter} by ${clientId}`)
  doTheJob(clientId, parameter)
  response.json({started: true})
}

app.post('/start', startJob)


app.listen(PORT, () => {
  console.log(`Facts Events service listening at http://localhost:${PORT}`)
})
