const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);

// creating object
// [socketID] : [userName]
let existingUsers = {};

app.use(express.static(__dirname)); // VERY-VERY IMPORTANT

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
    console.log("\nUser connected at socket ID: " + socket.id);

    socket.on("createNewUser", (userName) => {
        // Send existing users to the new user
        socket.emit("existingUsers", existingUsers);

        // Add the new user to the existingUsers object
        existingUsers[socket.id] = userName;
        console.log(
            'New user "' +
                userName +
                '" got connected with socket ID: ' +
                socket.id
        );

        // Broadcast to all connected clients about the new user
        io.emit("newUserAdded", socket.id, userName);
    });

    socket.on("disconnect", () => {
        console.log("\nUser disconnected: " + socket.id);
        // Broadcast to all connected clients about the disconnected user
        io.emit("userDisconnected", socket.id);
        delete existingUsers[socket.id];
    });

    socket.on("chat message", (targetSocketID, message) => {
        io.to(targetSocketID).emit("chat message", socket.id, message);
    });
});

server.listen(3000, () => {
    console.log("Server started at : http://localhost:3000");
});
