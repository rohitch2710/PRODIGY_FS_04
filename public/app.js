const socket = io("/");

let receiver = "baat-cheet";

const notificationPresent = document.querySelector("#notification-present");
let notificationsData = localStorage.getItem("notifications");
notificationsData = JSON.parse(notificationsData);
if (!notificationsData || !(notificationsData.length > 0)) {
  notificationsData = [];
} else {
  notificationPresent.classList.toggle("hidden");
}
const onlineUsersParent = document.querySelector("#online-users");
const chattingWith = document.querySelector("#chatting-with");
const notificationHandler = document.querySelectorAll(".notification_btn");
const notifications = document.querySelectorAll(".notifications");
const allNotifications = document.querySelector("#all-notifications");
const chatroomSetter = document.querySelector("#set_chatroom");
chatroomSetter.addEventListener("click", () => {
  if (receiver !== "baat-cheet") {
    receiver = "baat-cheet";
    chattingWith.innerText = "You are in public chat room";
    messageBox.innerHTML = "";
  }
});
notificationHandler.forEach((notification) => {
  notification.addEventListener("click", () => {
    allNotifications.innerHTML = "";
    if (notificationsData && notificationsData.length > 0) {
      notificationsData.forEach((notificationData) => {
        const notificationNode = document.createElement("div");
        notificationNode.classList.add(
          "bg-purple-300",
          "w-full",
          "rounded-lg",
          "p-2",
          "cursor-pointer"
        );
        notificationNode.id = notificationData.fromUserId;
        notificationNode.innerText = `You received ${
          notificationData.messageCount === 1
            ? "a message"
            : notificationData.messageCount + " messages"
        } from ${notificationData.fromUsername} at ${new Date(
          notificationData.time
        ).toLocaleString()}`;
        notificationNode.addEventListener("click", () => {
          if (receiver !== notificationData.fromUserId) {
            receiver = notificationData.fromUserId;
            chattingWith.innerText = `You are chatting with ${notificationData.fromUsername.toLowerCase()}`;
            messageBox.innerHTML = "";
          }
          notificationsData = notificationsData.filter((ntnData) => {
            return ntnData.fromUserId !== notificationData.fromUserId;
          });
          notificationsData.length > 0
            ? notificationPresent.classList.remove("hidden")
            : notificationPresent.classList.add("hidden");
          localStorage.setItem(
            "notifications",
            JSON.stringify(notificationsData)
          );
          notifications.forEach((box) => {
            box.classList.toggle("hidden");
            box.classList.toggle("fixed");
          });
          notificationData.messages.forEach((message) => {
            genMessage(message, "start");
          });
        });
        allNotifications.appendChild(notificationNode);
      });
    } else {
      const notificationNode = document.createElement("div");
      notificationNode.classList.add(
        "bg-purple-300",
        "w-full",
        "rounded-lg",
        "p-2",
        "cursor-pointer"
      );
      notificationNode.innerText = "No notifications";
      allNotifications.appendChild(notificationNode);
    }
    notifications.forEach((box) => {
      box.classList.toggle("hidden");
      box.classList.toggle("fixed");
    });
  });
});

function usersBlockGenerator(onlineUsers) {
  onlineUsersParent.innerHTML = "";
  if (onlineUsers.length > 0) {
    for (const user of onlineUsers) {
      const nameNode = genUsername(user.username);
      const outerNode = genUserBlock(user.userId);
      outerNode.appendChild(nameNode);
      outerNode.addEventListener("click", () => {
        if (receiver !== user.userId) {
          receiver = user.userId;
          chattingWith.innerText = `You are chatting with ${user.username.toLowerCase()}`;
          messageBox.innerHTML = "";
        }
      });
      onlineUsersParent.appendChild(outerNode);
    }
  } else {
    onlineUsersParent.innerText = "No user online";
  }
}
const genUserBlock = (userId) => {
  const userBlock = document.createElement("div");
  userBlock.classList.add(
    "p-2",
    "bg-white",
    "w-full",
    "rounded-md",
    "cursor-pointer"
  );
  userBlock.id = userId;
  return userBlock;
};

const genUsername = (username) => {
  const userName = document.createElement("h2");
  userName.classList.add("text-base", "mx-auto");
  userName.innerText = username;
  return userName;
};

const messageBox = document.querySelector("#all-messages");
const messageForm = document.querySelector("#message-form");
const messageInput = messageForm.querySelector("textarea");

messageInput.addEventListener("keypress", (evt) => {
  if (evt.code.toLowerCase() === "enter") {
    evt.preventDefault();
    if (messageForm.reportValidity()) {
      if (receiver === "baat-cheet") {
        socket.emit("public_message", {
          message: messageInput.value.trim()
        });
        genMessage(messageInput.value.trim(), "end");
      } else {
        socket.emit("private_message", {
          toUserId: receiver,
          message: messageInput.value.trim()
        });
      }
      messageInput.value = "";
    }
  }
});

const genMessage = (message, pos) => {
  const newMessage = document.createElement("div");
  newMessage.classList.add(
    "bg-white",
    "text-sm",
    "text-black",
    "p-2",
    "rounded-sm",
    "max-w-[50%]",
    "w-fit",
    "h-auto",
    "overflow-y-auto",
    "overflow-x-hidden",
    `self-${pos}`
  );
  newMessage.innerText = message.trim();
  messageBox.appendChild(newMessage);
};

const genPublicMessage = (message, pos, fromId, fromUsername) => {
  const newMessage = document.createElement("div");
  newMessage.classList.add(
    "bg-white",
    "text-sm",
    "text-black",
    "p-2",
    "rounded-sm",
    "max-w-[50%]",
    "w-fit",
    "h-auto",
    "flex",
    "flex-col",
    "justify-start",
    "items-starts",
    "overflow-y-auto",
    "overflow-x-hidden",
    "gap-1",
    `self-${pos}`
  );
  const messageReceived = document.createElement("p");
  messageReceived.innerText = message.trim();
  const fromUser = document.createElement("div");
  fromUser.innerText = fromUsername;
  fromUser.classList.add(
    "text-sm",
    "font-medium",
    "cursor-pointer",
    "p-1",
    "bg-black/50",
    "text-white",
    "rounded-md",
    "inline-block",
    "w-fit"
  );
  fromUser.id = fromId;
  fromUser.addEventListener("click", () => {
    receiver = fromId;
    chattingWith.innerText = `You are chatting with ${fromUsername.toLowerCase()}`;
    messageBox.innerHTML = "";
  });
  newMessage.appendChild(fromUser);
  newMessage.appendChild(messageReceived);
  messageBox.appendChild(newMessage);
};

messageForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  if (receiver === "baat-cheet") {
    socket.emit("public_message", {
      message: messageInput.value.trim()
    });
    genMessage(messageInput.value.trim(), "end");
  } else {
    socket.emit("private_message", {
      toUserId: receiver,
      message: messageInput.value.trim()
    });
  }
  messageInput.value = "";
});

socket.on("message_sent", ({ message }) => {
  genMessage(message, "end");
});

socket.on("public_message", (data) => {
  if (receiver === "baat-cheet") {
    genPublicMessage(data.message, "start", data.fromId, data.fromUsername);
  }
});

socket.on("get_online_users", (usersOnline) => {
  usersOnline = usersOnline.filter((user) => user.id !== socket.id);
  usersBlockGenerator(usersOnline);
});

socket.on("already_online", () => {
  const alertBoxes = document.querySelectorAll(".alerts");
  alertBoxes.forEach((alertBox) => {
    alertBox.classList.remove("hidden");
    alertBox.classList.add("fixed");
  });
});

socket.on("private_message", (data) => {
  if (receiver !== data.fromUserId) {
    notificationPresent.classList.remove("hidden");
    if (!(notificationsData && notificationsData.length > 0)) {
      notificationsData.push({
        ...data,
        messages: [data.message],
        messageCount: 1,
        status: "unread",
        time: Date.now()
      });
      localStorage.setItem(
        "notifications",
        JSON.stringify([
          {
            ...data,
            messages: [data.message],
            messageCount: 1,
            status: "unread",
            time: Date.now()
          }
        ])
      );
    } else {
      if (
        notificationsData.filter(
          (ntnData) => ntnData.fromUserId === data.fromUserId
        ).length > 0
      ) {
        notificationsData = notificationsData.map((ntnData) => {
          if (ntnData.fromUserId === data.fromUserId) {
            return {
              ...ntnData,
              messages: [...ntnData.messages, data.message],
              messageCount: ntnData.messageCount + 1,
              time: Date.now()
            };
          } else {
            return ntnData;
          }
        });
      } else {
        notificationsData.push({
          ...data,
          messages: [data.message],
          messageCount: 1,
          status: "unread",
          time: Date.now()
        });
      }
      localStorage.setItem("notifications", JSON.stringify(notificationsData));
    }
  } else {
    genMessage(data.message, "start");
  }
});

socket.on("user_offline", () => {
  const alertBoxes = document.querySelectorAll(".user_status");
  const closeBtn = alertBoxes[1].querySelector("img");
  closeBtn.addEventListener("click", () => {
    alertBoxes[1].classList.remove("flex");
    alertBoxes.forEach((alertBox) => {
      alertBox.classList.add("hidden");
    });
  });
  alertBoxes[1].classList.add("flex");
  alertBoxes.forEach((alertBox) => {
    alertBox.classList.remove("hidden");
  });
});

const hamburgers = document.querySelectorAll("#hamburger");
const sidebar = document.querySelector("#sidebar");

hamburgers.forEach((hamburger) => {
  hamburger.addEventListener("click", () => {
    console.log("clicked");
    sidebar.classList.toggle("hidden");
  });
});
