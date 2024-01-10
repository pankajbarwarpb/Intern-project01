let user_name = "";

while (user_name === "" || user_name === null || user_name === undefined) {
	user_name = prompt("Enter user name");
}

document.addEventListener("DOMContentLoaded", function () {
	console.log("DOM Loaded");
	let userClass = document.querySelector(".user-name");
	userClass.textContent = user_name;
	console.log("Saved name:", "Username " + user_name);
});

let networkUsers = [];
const socket = io();
socket.emit("createNewUser", user_name);

function addUserToList(socketID, userName) {
	let userList = document.getElementById("users-list");
	let listItem = document.createElement("li");

	let userNameSpan = document.createElement("span");
	userNameSpan.textContent = userName;

	let chatIcon = document.createElement("i");
	chatIcon.className = "fas fa-comment";

	// Attach the socketId as a data attribute to the list item
	listItem.setAttribute("data-socket-id", socketID);

	listItem.appendChild(userNameSpan);
	listItem.appendChild(chatIcon);

	userList.append(listItem);
}

socket.on("newUserAdded", (socketID, user_name) => {
	let new_user = {
		socket_id: socketID,
		user_name: user_name,
		chatWindowOpen: false,
		userPresent: true,
		messages: [],
	};
	networkUsers.push(new_user);

	alert(user_name + " added to the network");
	addUserToList(socketID, user_name);
});

socket.on("existingUsers", (existingUsers) => {
	if (Array.isArray(existingUsers)) {
		existingUsers.forEach((user) => {
			let new_user = {
				socket_id: user.socket_id,
				user_name: user.user_name,
				chatWindowOpen: false,
				userPresent: true,
				messages: [],
			};
			networkUsers.push(new_user);
			addUserToList(new_user.socket_id, new_user.user_name);
		});
	}
});

socket.on("userDisconneted", (socketID) => {
	alert("User disconnected : " + socketID);
});
