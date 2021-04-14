const file = require('fs');
const crypto = require('crypto');
const headers = require("./headers.js").headers;

let accounts = [];
var games = [];

if (file.existsSync("accounts.json")) {
  readFile();

}

class Board {
  constructor(line, count) {
    this.line = line;
    this.count = count;
  }
  //----------------------------
  getLine() {
    return this.line;
  }
  setLine(line) {
    this.line = line;
  }
  //----------------------------
  getCount() {
    return this.count;
  }
  setCount(count) {
    this.count = count;
  }
  //----------------------------
};

class Game {
  constructor(group, player1, player2, turn, board, status, respPlayer1, respPlayer2, countDraw, winner) {
    this.gameId = crypto.createHash('md5').update(group).digest('hex');
    this.player1 = player1;
    this.player2 = player2;
    this.turn = turn;
    this.board = board;
    this.status = status;
    this.winner = winner;
    this.respPlayer1 = respPlayer1;
    this.respPlayer2 = respPlayer2;
    this.countDraw = countDraw;
  }
  //----------------------------
  getGameId() {
    return this.gameId;
  }
  setGameId(group) {
    this.gameId = crypto.createHash('md5').update(group).digest('hex');
  }
  //----------------------------
  getPlayer1() {
    return this.player1;
  }
  setPlayer1(player1) {
    this.player1 = player1;
  }
  //----------------------------
  getPlayer2() {
    return this.player2;
  }
  setPlayer2(player2) {
    this.player2 = player2;
  }
  //----------------------------
  getTurn() {
    return this.turn;
  }
  setTurn(turn) {
    this.turn = turn;
  }
  //----------------------------
  getBoard() {
    return this.board;
  }
  setBoard(board) {
    this.board = board;
  }
  //----------------------------
  getStatus() {
    return this.status;
  }
  setStatus(status) {
    this.status = status;
  }
  //----------------------------
  getWinner() {
    return this.winner;
  }
  setWinner(winner) {
    this.winner = winner;
  }
  //----------------------------

  getRespPlayer1() {
    return this.respPlayer1;
  }
  setRespPlayer1(respPlayer1) {
    this.respPlayer1 = respPlayer1;
  }
  //----------------------------
  getRespPlayer2() {
    return this.respPlayer2;
  }
  setRespPlayer2(respPlayer2) {
    this.respPlayer2 = respPlayer2;
  }
  //----------------------------
  getCountDraw() {
    return this.countDraw;
  }
  setCountDraw(countDraw) {
    this.countDraw = countDraw;
  }
  //----------------------------

};

module.exports.methodPost = function (pathname, request, query, response) {
  switch (pathname) {
    case "/register":
      registerServer(query.nick, query.pass, response);
      break;

    case "/join":
      joinGameServer(query.group, query.nick, query.pass, response)
      break;

    case "/leave":
      leaveGameServer(query.game, query.nick, query.pass, response);
      break;

    case "/notify":
      notifyGameServer(query.nick, query.pass, query.game, query.move, response);
      break;

    case "/ranking":
      rankingServer(response);
      break;

    default:
      response.writeHead(404, headers.plain);
      response.end();
      break;
  }
}

module.exports.methodGet = function (pathname, request, query, response) {
  switch (pathname) {
    case "/":
      file.readFile(__dirname + "/index.html", function (err, info) {
        if (err) {
          response.writeHead(404);
          response.end();
        }
        else {
          response.writeHead(200, headers.html);
          response.write(info);
          response.end();
        }
      });
      break;
    case "/update":
      updateGameServer(query.nick, query.game, response);
      break;
    default:
      file.readFile(__dirname + pathname, function (err, info) {
        if (err) {
          response.writeHead(404);
          response.end();
        }
        else {
          switch (pathname) {
            case "/headers.js":
              response.writeHead(200, headers.plain);
              break;
            case "/index.js":
              response.writeHead(200, headers.plain);
              break;
            case "/methods.js":
              response.writeHead(200, headers.plain);
              break;
          }
          response.write(info);
          response.end();
        }
      });
      break;
  }
}

function updateGameServer(name, game, response) {
  if (name === null) {
    response.writeHead(400, headers.plain);
    response.write(JSON.stringify({ error: "User is undefined" }));
    response.end();
    return;
  }
  else if (game === null) {
    response.writeHead(400, headers.plain);
    response.write(JSON.stringify({ error: "Game is undefined" }));
    response.end();
    return;
  }
  let roomPlaying = -1;
  for (let i = 0; i < games.length; i++) {
    if (games[i].getGameId() === game) {
      roomPlaying = i;
      if (games[i].getPlayer1() === name && games[i].getRespPlayer1() === null) {
        games[i].setRespPlayer1(response);
        response.writeHead(200, headers.sse);
        return;
      }
      else if (games[i].getPlayer2() === name && games[i].getRespPlayer2() === null) {
        games[i].setRespPlayer2(response);
        response.writeHead(200, headers.sse);
        let data = dataServer(i);
        if (games[i].getRespPlayer1() !== null)
          games[i].getRespPlayer1().write('data: ' + data + '\n\n');
        if (games[i].getRespPlayer2() !== null)
          games[i].getRespPlayer2().write('data: ' + data + '\n\n');
        return;
      }
    }
  }

  if (roomPlaying == -1) {
    response.writeHead(200, headers.sse);
    response.write(JSON.stringify({ error: "Invalid game reference" }));
    response.end();
    return;
  }
  else {
    let data = dataServer(roomPlaying);
    if (games[roomPlaying].getRespPlayer1() !== null)
      games[roomPlaying].getRespPlayer1().write('data: ' + data + '\n\n');
    if (games[roomPlaying].getRespPlayer2() !== null)
      games[roomPlaying].getRespPlayer2().write('data: ' + data + '\n\n');
  }
}


function notifyGameServer(name, pass, game, move, response) {
  if (name === null) {
    response.writeHead(400, headers.plain);
    response.write(JSON.stringify({ error: "User is undefined" }));
    response.end();
    return;
  }
  else if (pass === null) {
    response.writeHead(400, headers.plain);
    response.write(JSON.stringify({ error: "Password is undefined" }));
    response.end();
    return;
  }
  else if (game === null) {
    response.writeHead(400, headers.plain);
    response.write(JSON.stringify({ error: "Password is undefined" }));
    response.end();
    return;
  }
  else if (name === "" || pass === "") {
    let answer = JSON.stringify({ error: "User and Password can't be empty" });
    response.writeHead(401, headers.plain);
    response.write(answer);
    response.end();
    return;
  }
  else if (move.row === 3 && move.col === 3) {
    let answer = JSON.stringify({ error: "Posição Inválida" });
    response.writeHead(401, headers.plain);
    response.write(answer);
    response.end();
    return;
  }
  else {
    let notRegistred = 1;
    for (let i = 0; i < accounts.length; i++) {
      const hash = crypto.createHash('md5').update(pass).digest('hex');
      if (accounts[i].nick === name && accounts[i].pass !== hash) {
        notRegistred = 0;
        let answer = JSON.stringify({ error: "Wrong Password" });
        response.writeHead(401, headers.plain);
        response.write(answer);
        response.end();
        return;
      }
      else if (accounts[i].nick === name && accounts[i].pass === hash) {
        notRegistred = 0;
        break;
      }
    }
    if (notRegistred == 1) {
      let answer = JSON.stringify({ error: "Account does not Exist" });
      response.writeHead(401, headers.plain);
      response.write(answer);
      response.end();
      return;
    }
  }

  let roomPlaying = -1;
  for (let i = 0; i < games.length; i++) {
    if (games[i].getGameId() === game) {
      roomPlaying = i;
      break;
    }
  }
  //-----------


}

function checkWinner(i) {
  let count = games[i].getBoard().getCount();
  if (games[i].getCountDraw() == 3) {
    if (accounts[j].nick === games[i].getPlayer2()) {
      accounts[j].games++;
    }
    if (accounts[j].nick === games[i].getPlayer1()) {
      accounts[j].games++;
    }
    updateServerRanks();
    games[i].setWinner("draw");
  }
  else if (count[games[i].getPlayer1()] === 0) {
    for (let j = 0; j < accounts.length; j++) {
      if (accounts[j].nick === games[i].getPlayer1()) {
        accounts[j].victories++;
        accounts[j].games++;
      }
      if (accounts[j].nick === games[i].getPlayer2()) {
        accounts[j].games++;
      }
    }

    updateServerRanks();
    games[i].setWinner(games[i].getPlayer1());
  }
  else if (count[games[i].getPlayer2()] === 0) {
    for (let j = 0; j < accounts.length; j++) {
      if (accounts[j].nick === games[i].getPlayer2()) {
        accounts[j].victories++;
        accounts[j].games++;
      }
      if (accounts[j].nick === games[i].getPlayer1()) {
        accounts[j].games++;
      }
    }

    updateServerRanks();
    games[i].setWinner(games[i].getPlayer2());
  }
}

function dataServer(i) {

  let data = {
    board: games[i].getBoard().getLine(),
    count: games[i].getBoard().getCount(),
    turn: games[i].getTurn(),
    winner: games[i].getWinner()
  };
  data = JSON.stringify(data);
  return data;
}
function rankingServer(response) {

  let ranks = [];

  let conta = {
    nick: "",
    games: 0,
    victories: 0
  };

  for (let i = 0; i < accounts.length; i++) {
    if (i == 10)
      break;
    let conta = {
      nick: accounts[i].nick,
      games: accounts[i].games,
      victories: accounts[i].victories
    };
    ranks.push(conta);
  }
  ranks = { ranking: ranks };
  response.writeHead(200, headers.plain);
  response.write(JSON.stringify(ranks));
  response.end();

}

function registerServer(name, pass, response) {
  let notRegistred = 1;

  if (name === null) {
    response.writeHead(400, headers.plain);
    response.write(JSON.stringify({ error: "User is undefined" }));
    response.end();
    return;
  }
  else if (pass === null) {
    response.writeHead(400, headers.plain);
    response.write(JSON.stringify({ error: "Password is undefined" }));
    response.end();
    return;
  }

  if (name === "" || pass === "") {
    let answer = JSON.stringify({ error: "User and Password can't be empty" });
    response.writeHead(401, headers.plain);
    response.write(answer);
    response.end();
    return;
  }
  for (let i = 0; i < accounts.length; i++) {
    const hash = crypto.createHash('md5').update(pass).digest('hex');
    if (accounts[i].nick === name && accounts[i].pass === hash) {
      notRegistred = 0;
      let answer = JSON.stringify({});
      response.writeHead(200, headers.plain);
      response.write(answer);
      response.end();
      break;
    }
    else if (accounts[i].nick === name && accounts[i].pass !== hash) {
      notRegistred = 0;
      let answer = JSON.stringify({ error: "Wrong Password" });
      response.writeHead(401, headers.plain);
      response.write(answer);
      response.end();
      break;
    }
  }
  if (notRegistred === 1) {
    let answer = JSON.stringify({});
    const hash = crypto.createHash('md5').update(pass).digest('hex');
    const conta = {
      nick: name,
      pass: hash,
      games: 0,
      victories: 0
    };
    registerAccount(conta);
    response.writeHead(200, headers.plain);
    response.write(answer);
    response.end();
  }
}

function joinGameServer(group, name, pass, response) {
  let foundRoom = 0;
  if (name === null) {
    response.writeHead(400, headers.plain);
    response.write(JSON.stringify({ error: "User is undefined" }));
    response.end();
    return;
  }
  else if (pass === null) {
    response.writeHead(400, headers.plain);
    response.write(JSON.stringify({ error: "Password is undefined" }));
    response.end();
    return;
  }
  else if (group === null) {
    response.writeHead(400, headers.plain);
    response.write(JSON.stringify({ error: "Group is undefined" }));
    response.end();
    return;
  }
  else if (name === "" || pass === "") {
    let answer = JSON.stringify({ error: "User and Password can't be empty" });
    response.writeHead(401, headers.plain);
    response.write(answer);
    response.end();
    return;
  }
  else {
    let notRegistred = 1;
    for (let i = 0; i < accounts.length; i++) {
      const hash = crypto.createHash('md5').update(pass).digest('hex');
      if (accounts[i].nick === name && accounts[i].pass !== hash) {
        notRegistred = 0;
        let answer = JSON.stringify({ error: "Wrong Password" });
        response.writeHead(401, headers.plain);
        response.write(answer);
        response.end();
        return;
      }
      else if (accounts[i].nick === name && accounts[i].pass === hash) {
        notRegistred = 0;
        break;
      }
    }
    if (notRegistred == 1) {
      let answer = JSON.stringify({ error: "Account does not Exist" });
      response.writeHead(401, headers.plain);
      response.write(answer);
      response.end();
      return;
    }
  }
  for (let i = 0; i < games.length; i++) {
    const hash = crypto.createHash('md5').update(group).digest('hex');
    if (games[i].getGameId() === hash) {
      foundRoom = 1;
      if (games[i].getStatus() === "waiting") {
        if (games[i].getPlayer1() === name) {
          response.writeHead(400, headers.plain);
          response.write(JSON.stringify({ error: "Already in this room" }));
          response.end();
          break;
        }
        games[i].setPlayer2(name);
        games[i].setStatus("ready");
        let player2Hand = "light";
        let count = games[i].getBoard().getCount();
        count["light"] = 2;
        count["empty"] = 64 - count["dark"] - count["light"];
        games[i].getBoard().setCount(count);
        response.writeHead(200, headers.plain);
        response.write(JSON.stringify({ game: games[i].getGameId(), color: player2Hand }));
        response.end();
        break;
      }
      else {
        response.writeHead(400, headers.plain);
        response.write(JSON.stringify({ error: "Game in Progress" }));
        response.end();
        break;
      }
    }
  }
  if (foundRoom === 0) {
    let count = {};
    count["dark"] = 2;

    let newBoard = new Board([
      ["empty", "empty", "empty", "empty", "empty", "empty", "empty", "empty"],
      ["empty", "empty", "empty", "empty", "empty", "empty", "empty", "empty"],
      ["empty", "empty", "empty", "empty", "empty", "empty", "empty", "empty"],
      ["empty", "empty", "empty", "light", "dark", "empty", "empty", "empty"],
      ["empty", "empty", "empty", "dark", "light", "empty", "empty", "empty"],
      ["empty", "empty", "empty", "empty", "empty", "empty", "empty", "empty"],
      ["empty", "empty", "empty", "empty", "empty", "empty", "empty", "empty"],
      ["empty", "empty", "empty", "empty", "empty", "empty", "empty", "empty"]
    ], count);
    let newGame = new Game(group, name, "", name, newBoard, "waiting", null, null, 0);
    const hash = crypto.createHash('md5').update(group).digest('hex');
    games.push(newGame);


    let player1Hand = "dark";
    response.writeHead(200, headers.plain);
    response.write(JSON.stringify({ game: games[games.length - 1].getGameId(), color: player1Hand }));
    response.end();
  }
}

function leaveGameServer(game, name, pass, response) {

  if (name === null) {
    response.writeHead(400, headers.plain);
    response.write(JSON.stringify({ error: "User is undefined" }));
    response.end();
    return;
  }
  else if (pass === null) {
    response.writeHead(400, headers.plain);
    response.write(JSON.stringify({ error: "Password is undefined" }));
    response.end();
    return;
  }
  else if (game === null) {
    response.writeHead(400, headers.plain);
    response.write(JSON.stringify({ error: "Game is undefined" }));
    response.end();
    return;
  }
  else if (name === "" || pass === "") {
    let answer = JSON.stringify({ error: "User and Password can't be empty" });
    response.writeHead(401, headers.plain);
    response.write(answer);
    response.end();
    return;
  }
  else {
    let notRegistred = 1;
    for (let i = 0; i < accounts.length; i++) {
      const hash = crypto.createHash('md5').update(pass).digest('hex');
      if (accounts[i].nick === name && accounts[i].pass !== hash) {
        notRegistred = 0;
        let answer = JSON.stringify({ error: "Wrong Password" });
        response.writeHead(401, headers.plain);
        response.write(answer);
        response.end();
        return;
      }
      else if (accounts[i].nick === name && accounts[i].pass === hash) {
        notRegistred = 0;
      }
    }
    if (notRegistred == 1) {
      let answer = JSON.stringify({ error: "Account does not Exist" });
      response.writeHead(401, headers.plain);
      response.write(answer);
      response.end();
      return;
    }
  }
  for (let i = 0; i < games.length; i++) {
    if (games[i].getGameId() === game) {

      if (games[i].getStatus() === "finish" || games[i].getStatus() === "waiting") {
        if (games[i].getRespPlayer1() !== null) {
          games[i].getRespPlayer1().end();
        }
        if (games[i].getRespPlayer2() !== null) {
          games[i].getRespPlayer2().end();
        }
        response.writeHead(200, headers.plain);
        response.write(JSON.stringify({}));
        response.end();
        games.splice(i, 1);
      }
      else {
        games[i].setStatus("finish");
        let winner = 1; //ganhou player1
        if (typeof games[i].getWinner() !== 'undefined')
          winner = 0;
        else if (name === games[i].getPlayer1())
          winner = 2; //ganhou player2
        for (let j = 0; j < accounts.length; j++) {
          if (winner == 1) {
            if (typeof games[i].getWinner() === 'undefined')
              games[i].setWinner(games[i].getPlayer1());
            if (accounts[j].nick === games[i].getPlayer1()) {
              accounts[j].games++;
              accounts[j].victories++;
            }
            if (accounts[j].nick === games[i].getPlayer2()) {
              accounts[j].games++;
            }
            updateServerRanks();

            let data = dataServer(i);
            if (games[i].getRespPlayer1() !== null)
              games[i].getRespPlayer1().write('data: ' + data + '\n\n');
            if (games[i].getRespPlayer2() !== null)
              games[i].getRespPlayer2().write('data: ' + data + '\n\n');
          }
          else if (winner == 2) {
            if (typeof games[i].getWinner() === 'undefined')
              games[i].setWinner(games[i].getPlayer2());
            if (accounts[j].nick === games[i].getPlayer2()) {
              accounts[j].games++;
              accounts[j].victories++;
            }
            if (accounts[j].nick === games[i].getPlayer1()) {
              accounts[j].games++;
            }
            updateServerRanks();

            let data = dataServer(i);
            if (games[i].getRespPlayer1() !== null)
              games[i].getRespPlayer1().write('data: ' + data + '\n\n');
            if (games[i].getRespPlayer2() !== null)
              games[i].getRespPlayer2().write('data: ' + data + '\n\n');
          }
        }
        response.writeHead(200, headers.plain);
        response.write(JSON.stringify({}));
        response.end();
      }
      break;
    }
  }
}

//Store all the accounts registred at the moment
function readFile() {
  let data = file.readFileSync("accounts.json");
  if (data.length === 0)
    return;
  let parsedData = JSON.parse(data.toString())["users"];
  for (let i = 0; i < parsedData.length; i++) {
    accounts.push(parsedData[i]);
  }
}

//Register new account
function registerAccount(data) {
  accounts.push(data);
  let finalData = { users: accounts };
  file.writeFileSync("./accounts.json", JSON.stringify(finalData));
}

function updateServerRanks() {
  let finalData = { users: accounts };
  file.writeFileSync("./accounts.json", JSON.stringify(finalData));
}



// {"board":[
//   ["empty","empty","empty","empty","empty","empty","empty","empty"],
//   ["empty","empty","empty","empty","empty","empty","empty","empty"],
//   ["empty","empty","empty","empty","empty","empty","empty","empty"],
//   ["empty","empty","empty","light","dark","empty","empty","empty"],
//   ["empty","empty","empty","dark","light","empty","empty","empty"],
//   ["empty","empty","empty","empty","empty","empty","empty","empty"],
//   ["empty","empty","empty","empty","empty","empty","empty","empty"],
//   ["empty","empty","empty","empty","empty","empty","empty","empty"]
//]
//   ,"count":{
//       "dark":2,
//       "light":2,
//       "empty":60
//   },
//   "turn":"zas"
// }