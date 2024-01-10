const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);

let existingUsers = [];

app.use(express.static(__dirname)); // VERY-VERY IMPORTANT

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
	console.log("User connected at socket ID : " + socket.id);
	socket.on("createNewUser", (user_name) => {
		io.to(socket.id).emit("existingUsers", existingUsers);

		const newUser = {
			socket_id: socket.id,
			user_name: user_name,
		};
		existingUsers.push(newUser);

		console.log(
			"New user " +
				user_name +
				" got connected with socket ID : " +
				socket.id
		);

		socket.emit("newUserAdded", socket.id, user_name);
	});

	socket.on("disconnect", () => {
		console.log("user disconnedted : " + socket.id);
		io.emit("userDisconneted", socket.id);
	});
});

server.listen(3000, () => {
	console.log("Server started at : http://localhost:3000");
});
