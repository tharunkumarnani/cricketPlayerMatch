let express = require("express");
let app = express();
app.use(express.json());
let sqlite3 = require("sqlite3");
let { open } = require("sqlite");
let path = require("path");
let dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db;
let initializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at 3000");
    });
  } catch (e) {
    console.log(`db error msg : ${e.message}`);
    process.exit(1);
  }
};

initializeDbServer();

const changeCamelCase = (listArray) => {
  const updatedArray = listArray.map((each) => {
    return {
      playerId: each.player_id,
      playerName: each.player_name,
    };
  });
  return updatedArray;
};

// 1.get players api

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    select * from player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  const changedCaseArray = changeCamelCase(playersArray);
  response.send(changedCaseArray);
});

//2.get player api

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    select * from player_details where player_id=${playerId};`;
  const getPlayer = await db.get(getPlayerQuery);
  const changedCase = changeCamelCase([getPlayer]);
  response.send(changedCase[0]);
});

//3.update details api

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
    update player_details 
    set player_name='${playerName}'
    where player_id=${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//4.get match api

const changeMatchCase = (listArray) => {
  const updateArray = listArray.map((each) => {
    return {
      matchId: each.match_id,
      match: each.match,
      year: each.year,
    };
  });
  return updateArray;
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    select * from match_details where match_id=${matchId};`;
  const matchDetails = await db.get(getMatchQuery);
  const updateCaseMatch = changeMatchCase([matchDetails]);
  response.send(updateCaseMatch[0]);
});

//5.get all matches of a player api

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesPlayerQuery = `
    select match_id as matchId,match,year from player_match_score natural join match_details where player_id=${playerId};`;
  const getMatches = await db.all(getMatchesPlayerQuery);
  response.send(getMatches);
});

//6.get all players of a specific match api

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersByMatchQuery = `
    select player_id as playerId,player_name as playerName from player_match_score natural join player_details where match_id=${matchId};`;
  const playersArray = await db.all(getPlayersByMatchQuery);
  response.send(playersArray);
});

//7.get statistics of total score,fours,sixes of a player on the player Id

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatisticsQuery = `
    select player_id as playerId,player_name as playerName,sum(score) as totalScore,sum(fours) as totalFours,sum(sixes) as totalSixes 
    from player_match_score natural join player_details 
    where player_id=${playerId} 
    group by player_id;`;
  const playerStatistics = await db.get(getPlayerStatisticsQuery);
  response.send(playerStatistics);
});

module.exports = app;
