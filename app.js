const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "W";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {
  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
  } else {
    uniquesocket.emit("spectatorRole");
  }

  uniquesocket.on("disconnect", function () {
    if (uniquesocket.id === players.white) {
      delete players.white;
      io.emit("opponentDisconnected", "White player has disconnected.");
    } else if (uniquesocket.id === players.black) {
      delete players.black;
      io.emit("opponentDisconnected", "Black player has disconnected.");
    }
  });

  uniquesocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniquesocket.id !== players.white) {
        uniquesocket.emit("notYourTurn", "It's not your turn!");
        return;
      }
      if (chess.turn() === "b" && uniquesocket.id !== players.black) {
        uniquesocket.emit("notYourTurn", "It's not your turn!");
        return;
      }

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        uniquesocket.emit("invalidMove", move);
      }
    } catch (err) {
      uniquesocket.emit("invalidMove", move);
    }
  });
});

server.listen(3000, function () {
 });