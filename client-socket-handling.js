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

function addMsgToMessages(message, isIncoming, exited = 0) {
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
    const interactedUsersElement = document.getElementById("interactedUsers");
    const totalUsersElement = document.getElementById("totalUsers");

    // Update the text content of the elements
    interactedUsersElement.textContent =
        "Interacted users : " + interactedUsers;
    totalUsersElement.textContent = "Total users : " + totalUsers;
}

document.addEventListener("DOMContentLoaded", function () {
    editGraph();

    let userClass = document.querySelector(".user-name");
    userClass.textContent = `User name : ${userName}`;

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

        addMsgToMessages(input.value, 0);

        socket.emit("chat message", chatUserID, input.value);

        // Optionally, clear the input field after sending the message
        input.value = "";
    });
});

function openChatWindow() {
    const chatWindow = document.querySelector(".innerSection");
    chatWindow.style.display = "flex";

    // Get the ul element by its id
    const messagesElement = document.getElementById("messages");

    const sendButton = document.getElementById("sendButton");
    sendButton.disabled = false;

    // Empty the content of the ul
    messagesElement.innerHTML = "";

    let userMessages = networkUsers[chatUserID].messages;

    networkUsers[chatUserID].newMessage = false;
    updateULlist();

    for (let i = 0; i < userMessages.length; i++) {
        let isIncoming = userMessages[i].in;
        let message = userMessages[i].message;
        addMsgToMessages(message, isIncoming);
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
                // Add your chat icon click functionality here
                if (chatUserID) {
                    networkUsers[chatUserID].chatWindowOpen = false;
                    if (networkUsers[chatUserID].userLeft) {
                        delete networkUsers[chatUserID];
                    }
                }
                chatUserID = socketID;

                const otherUserNameElement =
                    document.querySelector(".otherUserName");

                // Set its text content to the userName from networkUsers
                otherUserNameElement.textContent =
                    networkUsers[chatUserID].userName;

                networkUsers[chatUserID].chatWindowOpen = true;
                openChatWindow();
            });

            // Append the new list item to the ul
            userListElement.appendChild(listItem);
        }
    }
}

function addUsers(socketID, userName) {
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
    addUsers(socketID, userName);
    updateULlist();
    alert(`** ${userName} ** entered the network`);
    totalUsers++;
    editGraph();
});

socket.on("existingUsers", (existingUsers) => {
    for (let socketID in existingUsers) {
        addUsers(socketID, existingUsers[socketID]);
    }
    updateULlist();
    editGraph();
});

socket.on("userDisconnected", (socketID) => {
    alert("User disconnected : " + networkUsers[socketID]?.userName);
    networkUsers[socketID].userLeft = true;

    if (networkUsers[socketID].interaction == true) {
        interactedUsers--;
    }
    if (networkUsers[socketID].chatWindowOpen == false) {
        delete networkUsers[socketID];
    }

    if (chatUserID == socketID) {
        addMsgToMessages("** USER LEFT THE CHAT **", 1, 1);
    }

    const sendButton = document.getElementById("sendButton");
    sendButton.disabled = true;

    updateULlist();
    totalUsers--;
    editGraph();
});

socket.on("chat message", (socketID, message) => {
    if (chatUserID == socketID) {
        addMsgToMessages(message, 1);
    } else {
        alert(
            "** " + networkUsers[socketID].userName + " ** sent you a message"
        );
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
