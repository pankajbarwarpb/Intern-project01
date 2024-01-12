// import Chart from "chart.js/auto";

let userName = "";
let chatUserID = "";

while (userName === "" || userName === null || userName === undefined) {
	userName = prompt("Enter user name :");
}

let networkUsers = {};
const socket = io();
socket.emit("createNewUser", userName);

let totalUsers = 0;
let interactedUsers = 0;

function addMsgToChatWindow(message, isIncoming, exited = 0) {
	const messages = document.getElementById("messages");
	const item = document.createElement("li");
	item.textContent = message;

	// Set text-align based on the 'in' parameter
	item.style.textAlign = isIncoming ? "left" : "right";
	if (exited) item.style.textAlign = "center";

	messages.appendChild(item);
	window.scrollTo(0, document.body.scrollHeight);
}

function editGraph() {
	// Get the canvas element
	const canvas = document.getElementById("doughnutChart");
	const ctx = canvas.getContext("2d");

	// Check if the canvas has an existing chart instance with the same data
	if (canvas.chartInstance) {
		const existingData = canvas.chartInstance.config.data.datasets[0].data;

		if (
			existingData[0] === interactedUsers &&
			existingData[1] === totalUsers - interactedUsers
		) {
			// The data is the same, no need to update the chart
			// console.log("Data is the same. No update needed.");
		} else {
			// Destroy existing chart if it exists and the data is different
			canvas.chartInstance.destroy();
			createNewDoughnutChart();
		}
	} else {
		// If no existing chart, create a new one
		createNewDoughnutChart();
	}

	function createNewDoughnutChart() {
		// Doughnut Chart
		const doughnutChart = new Chart(ctx, {
			type: "doughnut",
			data: {
				labels: ["Interacted Users", "Non-Interacted Users"],
				datasets: [
					{
						data: [interactedUsers, totalUsers - interactedUsers],
						backgroundColor: ["#36A2EB", "#FFCE56"],
					},
				],
			},
			options: {
				cutoutPercentage: 70,
				responsive: true,
				maintainAspectRatio: false,
				legend: {
					display: false,
				},
			},
		});

		// Save the chart instance to the canvas for later destruction
		canvas.chartInstance = doughnutChart;
	}
}

document.addEventListener("DOMContentLoaded", function () {
	editGraph();

	// Set username
	let userClass = document.querySelector(".user-name");
	userClass.textContent = `Username : ${userName}`;

	// Closing the chat window
	document
		.querySelector(".closeButton")
		.addEventListener("click", function () {
			// Disable the chat section
			if (chatUserID != "") {
				networkUsers[chatUserID].chatWindowOpen = false;
				if (networkUsers[chatUserID]?.userLeft) {
					delete networkUsers[chatUserID];
				}
			}
			document.querySelector(".innerSection").style.display = "none";
			chatUserID = "";
			updateULlist();
			editGraph();
		});

	const sendButton = document.getElementById("sendButton");
	const input = document.getElementById("input");

	input.addEventListener("keydown", function (event) {
		// Check if the pressed key is Enter (keyCode 13) or Enter (key "Enter")
		if (event.key === "Enter") {
			// Prevent the default form submission behavior
			event.preventDefault();

			// Perform the function of the button (e.g., click)
			sendButton.click();
		}
	});

	sendButton.addEventListener("click", function () {
		if (!input) return;

		if (networkUsers[chatUserID].interaction == false) {
			interactedUsers++;
			networkUsers[chatUserID].interaction = true;
		}

		editGraph();

		// Emit the chat message
		networkUsers[chatUserID].messages.push({
			in: false,
			message: input.value,
		});

		addMsgToChatWindow(input.value, 0);

		socket.emit("chat message", chatUserID, input.value);

		// Optionally, clear the input field after sending the message
		input.value = "";
	});
});

function openChatWindow(socketID) {
	// Add your chat icon click functionality here
	if (chatUserID) {
		networkUsers[chatUserID].chatWindowOpen = false;
		if (networkUsers[chatUserID].userLeft) {
			delete networkUsers[chatUserID];
		}
	}

	chatUserID = socketID;

	const otherUserNameElement = document.querySelector(".otherUserName");

	// Set its text content to the userName from networkUsers
	otherUserNameElement.textContent = networkUsers[chatUserID].userName;

	networkUsers[chatUserID].chatWindowOpen = true;

	const chatWindow = document.querySelector(".innerSection");
	chatWindow.style.display = "flex";

	// Get the ul element by its id
	const messagesElement = document.getElementById("messages");

	const sendButton = document.getElementById("sendButton");
	sendButton.disabled = false;

	sendButton.classList.remove("non-clickable");

	// Empty the content of the ul
	messagesElement.innerHTML = "";

	let userMessages = networkUsers[chatUserID].messages;

	networkUsers[chatUserID].newMessage = false;
	updateULlist();

	for (let i = 0; i < userMessages.length; i++) {
		let isIncoming = userMessages[i].in;
		let message = userMessages[i].message;
		addMsgToChatWindow(message, isIncoming);
	}
	const inputElement = document.getElementById("input");
	if (inputElement) {
		inputElement.focus();
	}
}

function updateULlist() {
	// Get the ul element by its id
	let userListElement = document.getElementById("users-list");
	userListElement.innerHTML = "";

	for (let socketID in networkUsers) {
		// Create a new list item
		let listItem = document.createElement("li");

		// Check if userLeft is true, if so, don't display the list item
		if (!networkUsers[socketID].userLeft) {
			// adding userName
			let displayName = document.createElement("span");
			displayName.textContent = networkUsers[socketID].userName;
			listItem.appendChild(displayName);

			// Check if newMessage is true, if so, add a bell icon
			if (networkUsers[socketID].newMessage) {
				let bellIcon = document.createElement("span");
				bellIcon.textContent = " 🔔"; // You can use an image or other icon if preferred
				listItem.appendChild(bellIcon);
			}

			// Add a clickable chat icon on the right side
			let chatIcon = document.createElement("span");
			chatIcon.textContent = " 💬"; // You can use an image or other icon if preferred
			listItem.appendChild(chatIcon);

			listItem.style.cursor = "pointer";

			listItem.addEventListener("click", function () {
				openChatWindow(socketID);
			});

			// Append the new list item to the ul
			userListElement.appendChild(listItem);
		}
	}
}

function addUsersToNetwork(socketID, userName) {
	networkUsers[socketID] = {
		userName: userName,
		userLeft: false,
		chatWindowOpen: false,
		newMessage: false,
		interaction: false,
		messages: [],
	};
}

socket.on("newUserAdded", (socketID, userName) => {
	addUsersToNetwork(socketID, userName);
	updateULlist();

	totalUsers++;
	editGraph();
});

socket.on("existingUsers", (existingUsers) => {
	for (let socketID in existingUsers) {
		addUsersToNetwork(socketID, existingUsers[socketID]);
		totalUsers++;
	}
	updateULlist();
	editGraph();
});

socket.on("userDisconnected", (socketID) => {
	networkUsers[socketID].userLeft = true;

	if (networkUsers[socketID].interaction == true) {
		interactedUsers--;
	}
	if (networkUsers[socketID].chatWindowOpen == false) {
		delete networkUsers[socketID];
	}

	if (chatUserID == socketID) {
		addMsgToChatWindow("** USER LEFT THE CHAT **", 1, 1);

		const sendButton = document.getElementById("sendButton");
		sendButton.disabled = true;

		sendButton.classList.add("non-clickable");
	}

	updateULlist();
	totalUsers--;
	editGraph();
});

socket.on("chat message", (socketID, message) => {
	if (chatUserID == socketID) {
		addMsgToChatWindow(message, 1);
	} else {
		networkUsers[socketID].newMessage = true;
		updateULlist();
	}
	networkUsers[socketID].messages.push({
		in: true,
		message: message,
	});
	if (networkUsers[socketID].interaction == false) {
		interactedUsers++;
		networkUsers[socketID].interaction = true;
	}
	editGraph();
});
