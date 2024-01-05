const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null

const initiallizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(
        'Server Running at https://yogichaitanyapncjfnjscpscvyl.drops.nxtwave.tech:3000/',
      )
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
    process.exit(1)
  }
}

initiallizeDBAndServer()

// API 1
app.get('/players/', async (request, response) => {
  const getAllPlayers = `SELECT * FROM player_details;`
  const playersArray = await db.all(getAllPlayers)

  const convertDBObjectToResponseObject = dbObject => {
    return {
      playerId: dbObject.player_id,
      playerName: dbObject.player_name,
    }
  }

  response.send(
    playersArray.map(eachPlayer => convertDBObjectToResponseObject(eachPlayer)),
  )
})

// API 2
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerDetails = `SELECT * FROM player_details WHERE player_id='${playerId}';`
  const findPlayer = await db.get(getPlayerDetails)

  const convertDBObjectToResponseObject = dbObject => {
    return {
      playerId: dbObject.player_id,
      playerName: dbObject.player_name,
    }
  }
  const result = convertDBObjectToResponseObject(findPlayer)
  response.send(result)
})

// API 3
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updateThePlayerName = `UPDATE player_details SET player_name='${playerName}' WHERE player_id='${playerId}';`
  await db.run(updateThePlayerName)
  response.send('Player Details Updated')
})

// API 4
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getSpecificMatch = `SELECT * FROM match_details WHERE match_id='${matchId}';`
  const match = await db.get(getSpecificMatch)

  const convertDBObjectToResponseObject = dbObject => {
    return {
      matchId: dbObject.match_id,
      match: dbObject.match,
      year: dbObject.year,
    }
  }
  const result2 = convertDBObjectToResponseObject(match)
  response.send(result2)
})

// API 5
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getAllTheMatchedOfAPlayer = `SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_match_score.player_id=${playerId};`
  const matchesArray = await db.all(getAllTheMatchedOfAPlayer)

  const convertDBObjectToResponseObject = dbObject => {
    return {
      matchId: dbObject.match_id,
      match: dbObject.match,
      year: dbObject.year,
    }
  }

  response.send(
    matchesArray.map(eachMatch => convertDBObjectToResponseObject(eachMatch)),
  )
})

// API 6
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getAllPlayersOfSpecificMatch = `
  SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName 
  FROM
    player_match_score
  NATURAL JOIN
    player_details
  WHERE
    match_id=${matchId};`
  const playersOfMatch = await db.all(getAllPlayersOfSpecificMatch)
  response.send(playersOfMatch)
})

// API 7
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getIndividualScore = `
  SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes 
  FROM
    player_details
  INNER JOIN
    player_match_score
  ON
    player_details.player_id=player_match_score.player_id
  WHERE 
    player_details.player_id=${playerId};`
  const playerIndividualscore = await db.get(getIndividualScore)
  response.send(playerIndividualscore)
})

module.exports = app
