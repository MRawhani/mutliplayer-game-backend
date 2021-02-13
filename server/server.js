const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const randomColor = require("randomcolor");
const createBoard = require("./create-board");
const createCooldown = require("./create-cooldown");

const { generateMessage, generateLocationMessage } = require("./utils/message");
const { isRealString } = require("./utils/validation");
const { Users } = require("./utils/users");

const publicPath = path.join(__dirname, "../public");
const port = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const users = new Users();

app.use(express.static(publicPath));

io.on("connection", (socket) => {
  console.log("New user connected");
  const color = randomColor();

  // increase number to have cooldown between turns
  const cooldown = createCooldown(0);

  const { makeTurn, getBoard, clear } = createBoard(50);
  io.emit("board", getBoard());

  socket.on("join", ({ name, room }, callback) => {
    makeTurnG = makeTurn;
    clearG = clear;

    if (!isRealString(name) || !isRealString(room)) {
      return callback("Name and room are required.");
    }

    console.log(`${name} has join the room`);

    socket.join(room);
    users.removeUser(socket.id);
    const user = users.addUser(socket.id, name, room);
    console.log("nouvel utilisateur", user);

    io.to(room).emit("updateUserList", users.getUserList(room));

    socket.emit(
      "newMessage",
      generateMessage("Admin", "Welcome to the chat app")
    );

    socket.broadcast
      .to(room)
      .emit("newMessage", generateMessage("Admin", `${name} has joined`));

    callback();
  });
  const onTurn = ({ x, y }) => {
    //  const user = users.getUser(socket.id)
    const user = users.getUser(socket.id);
    users.lastUser(socket.id,user.room)
    //  users.lastUser(socket.id,user.room)

    if (user && !user.last) {
      console.log("turn", user);
      const { room, name } = user;

      if (cooldown()) {
        io.to(room).emit("turn", { x, y, color });
        const playerWin = makeTurnG(x, y, color);

        if (playerWin) {
          io.to(socket.id).emit("message", "YOU WIN");
          io.to(room).emit("message", "new round");
          clearG();
          io.to(room).emit("board");
        }
      }
    }
  };

  // Disabled, until the client side is injection-proof
  socket.on("message", (text) => {
    const user = users.getUser(socket.id);
    //  users.lastUser(socket.id,user.room)

    if (user) {
      console.log("createMessage", user);
      const { room, name } = user;
      io.to(room).emit("message", text);
    }
  });
  socket.on("turn", onTurn);

  socket.on("createMessage", (msg, callback) => {
    const user = users.getUser(socket.id);
    //  users.lastUser(socket.id,user.room)

    if (user) {
      console.log("createMessage", user);
      const { room, name } = user;
      io.to(room).emit("newMessage", generateMessage(name, msg.text));
    }

    callback();
  });

  socket.on("createOffer", (data) => {
    const user = users.getUser(socket.id);
    console.log("got Offer");
    if (user) {
      socket.broadcast.to(user.room).emit("transmitOffer", data);
    }
  });

  socket.on("createLocationMessage", ({ latitude, longitude }) => {
    const user = users.getUser(socket.id);
    if (user) {
      const { room, name } = user;
      io.to(room).emit(
        "newLocationMessage",
        generateLocationMessage(name, latitude, longitude)
      );
    }
  });

  socket.on("askAudio", () => {
    const user = users.getUser(socket.id);
    console.log("askAudio");
    if (user) {
      const { room, name } = user;
      socket.broadcast.to(room).emit("shareAudioModal", name);
    }
  });

  socket.on("disconnect", () => {
    const user = users.removeUser(socket.id);

    if (user) {
      const { room, name } = user;

      console.log(`${name} has left the room`);

      io.to(room).emit("updateUserList", users.getUserList(room));
      io.to(room).emit(
        "newMessage",
        generateMessage("Admin", `${name} has left`)
      );
    }
  });
});

io.on("disconnection", (socket) => {
  console.log("User disconnected");
});

//game

/* app.get('/', (req, res) => res.sendFile('index.html')) */
server.listen(port, () => console.log("Example app listening on port " + port));
