const WebSocket = require("ws");
const axios = require("axios");
const server = new WebSocket.Server({ port: 9525 });
let onlineUsers = new Map();

function broadcastOnlineUsers() {
  const onlineUsersList = Array.from(onlineUsers.keys());
  const message = JSON.stringify({
    type: "ONLINE_USERS",
    users: onlineUsersList,
  });
  onlineUsers.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

async function fetchMessagesHistory(userName) {
  try {
    // Добавляем параметр userName к запросу
    const response = await axios.get(
      `http://localhost:80/api/getMSG.php?userName=${encodeURIComponent(
        userName
      )}`
    );
    return response.data.messages || [];
  } catch (error) {
    console.error("Ошибка при получении истории сообщений:", error);
    return [];
  }
}

async function handleLogin(dataMessage, ws) {
  const userName = dataMessage.enterName;
  onlineUsers.set(userName, ws);
  console.log("Пользователь вошел:", userName);
  console.log("Активные пользователи:", Array.from(onlineUsers.keys()));
  broadcastOnlineUsers();
  // Передаем userName при запросе истории сообщений
  try {
    const messagesHistory = await fetchMessagesHistory(userName);
    ws.send(
      JSON.stringify({
        type: "HISTORY_MESSAGES",
        messages: messagesHistory,
      })
    );
  } catch (error) {
    console.error("Ошибка при отправке истории:", error);
  }
}

async function handleSendMessage(dataMessage) {
  const { message, from, to } = dataMessage;
  const timestamp = new Date().toISOString();

  // Создаем объект сообщения
  const messageObject = {
    from,
    to,
    message,
    timestamp,
  };

  // Сохраняем сообщение в БД через API
  try {
    console.log("Сохраняем сообщение в БД:", {
      sender: from,
      receiver: to,
      content: message,
      timestamp: timestamp,
    });

    const response = await axios.post("http://localhost:80/api/safeMSG.php", {
      sender: from,
      receiver: to,
      content: message,
      timestamp: timestamp,
    });

    console.log("Ответ от API сохранения:", response.data);

    if (response.data.error) {
      console.error("Ошибка API при сохранении:", response.data.error);
    } else {
      // Добавляем ID сообщения из ответа API
      messageObject.id = response.data.id;
    }
  } catch (error) {
    console.error("Ошибка при отправке запроса к API:", error.message);
    if (error.response) {
      console.error("Ответ сервера:", error.response.data);
    }
  }

  // Отправляем сообщение получателю через WebSocket
  const recipientWebSoc = onlineUsers.get(to);
  if (recipientWebSoc) {
    recipientWebSoc.send(
      JSON.stringify({
        type: "MESSAGE",
        from: from,
        to: to,
        message: message,
        id: messageObject.id, // Передаем ID сообщения
        timestamp: timestamp,
      })
    );
  } else {
    console.log("Пользователь оффлайн:", to);
  }

  // Отправляем подтверждение отправителю
  const senderWebSoc = onlineUsers.get(from);
  if (senderWebSoc) {
    senderWebSoc.send(
      JSON.stringify({
        type: "MESSAGE_SENT",
        message: messageObject,
      })
    );
  }
}

// Новая функция для обработки групповых сообщений
async function handleSendGroupMessage(dataMessage) {
  const { message, from, groupName } = dataMessage;
  const timestamp = new Date().toISOString();

  console.log(
    `Отправка сообщения в группу ${groupName} от ${from}: ${message}`
  );

  try {
    // Получаем список пользователей в группе
    const response = await axios.get(
      `http://localhost:80/api/getUsersInGroup.php?groupName=${encodeURIComponent(
        groupName
      )}`
    );

    if (!response.data.success) {
      console.error(
        "Ошибка при получении пользователей группы:",
        response.data.error
      );
      return;
    }

    // Получаем строку с именами пользователей и разделяем её
    const usersArray = response.data.users;
    const groupUsers = usersArray.filter((user) => user);

    console.log(`Пользователи в группе ${groupName}:`, groupUsers);

    // Сохраняем сообщение в БД через API
    const saveResponse = await axios.post(
      "http://localhost:80/api/safeMSG.php",
      {
        sender: groupName, // Отправителем указываем саму группу
        receiver: "GROUP", // Маркер для групповых сообщений
        content: message,
        timestamp: timestamp,
        originalSender: from, // Сохраняем оригинального отправителя
        groupName: groupName, // Имя группы
      }
    );

    if (saveResponse.data.error) {
      console.error(
        "Ошибка API при сохранении группового сообщения:",
        saveResponse.data.error
      );
      return;
    }

    const messageId = saveResponse.data.id;

    // Создаем объект сообщения
    const messageObject = {
      id: messageId,
      from: groupName, // От имени группы
      originalSender: from, // Оригинальный отправитель
      to: "GROUP_MESSAGE",
      message: message,
      timestamp,
      isGroup: true,
    };

    // Отправляем сообщение всем пользователям в группе, кроме отправителя
    for (const user of groupUsers) {
      if (user !== from) {
        // Не отправляем сообщение обратно отправителю
        const userWebSocket = onlineUsers.get(user);

        if (userWebSocket) {
          console.log(
            `Отправка сообщения пользователю ${user} от группы ${groupName}`
          );
          userWebSocket.send(
            JSON.stringify({
              type: "GROUP_MESSAGE",
              from: groupName, // От имени группы
              originalSender: from, // Реальный отправитель
              to: user,
              message: message,
              id: messageId,
              timestamp: timestamp,
              isGroup: true,
            })
          );
        } else {
          console.log(
            `Пользователь ${user} не в сети, сообщение не доставлено`
          );
        }
      }
    }

    // Отправляем подтверждение отправителю
    const senderWebSoc = onlineUsers.get(from);
    if (senderWebSoc) {
      senderWebSoc.send(
        JSON.stringify({
          type: "GROUP_MESSAGE_SENT",
          message: {
            ...messageObject,
            from: from, // Для отправителя показываем, что сообщение от него
            to: groupName, // Назначение - группа
          },
        })
      );
    }
  } catch (error) {
    console.error("Ошибка при обработке группового сообщения:", error);
    if (error.response) {
      console.error("Ответ сервера:", error.response.data);
    }
  }
}

async function handleGetHistory(dataMessage, ws) {
  const userName = dataMessage.userName;
  if (!userName) {
    console.error("Имя пользователя не указано при запросе истории");
    return;
  }

  try {
    const messagesHistory = await fetchMessagesHistory(userName);
    ws.send(
      JSON.stringify({
        type: "HISTORY_MESSAGES",
        messages: messagesHistory,
      })
    );
  } catch (error) {
    console.error("Ошибка при получении истории сообщений:", error);
  }
}

async function handleDeleteMessage(dataMessage) {
  const { messageId, from, to, isGroup } = dataMessage;

  console.log(
    `Удаление сообщения ${messageId} от ${from} к ${to} (групповое: ${isGroup})`
  );

  if (isGroup) {
    try {
      // Получаем список пользователей в группе
      const response = await axios.get(
        `http://localhost:80/api/getUsersInGroup.php?groupName=${encodeURIComponent(
          to
        )}`
      );

      if (!response.data.success) {
        console.error(
          "Ошибка при получении пользователей группы:",
          response.data.error
        );
        return;
      }

      // Получаем массив с именами пользователей
      const usersArray = response.data.users;
      const groupUsers = usersArray.filter((user) => user);

      console.log(
        `Отправка уведомления об удалении сообщения ${messageId} пользователям группы ${to}:`,
        groupUsers
      );

      // Отправляем уведомление об удалении всем пользователям группы, кроме инициатора удаления
      for (const user of groupUsers) {
        if (user !== from) {
          // Не отправляем уведомление инициатору удаления
          const userWebSocket = onlineUsers.get(user);

          if (userWebSocket) {
            console.log(
              `Отправка уведомления об удалении пользователю ${user}`
            );
            userWebSocket.send(
              JSON.stringify({
                type: "MESSAGE_DELETED",
                messageId: messageId,
              })
            );
          } else {
            console.log(
              `Пользователь ${user} не в сети, уведомление не доставлено`
            );
          }
        }
      }
    } catch (error) {
      console.error(
        "Ошибка при отправке уведомлений об удалении группового сообщения:",
        error
      );
      if (error.response) {
        console.error("Ответ сервера:", error.response.data);
      }
    }
  } else {
    // Отправляем уведомление получателю для личных сообщений
    const recipientWebSoc = onlineUsers.get(to);
    if (recipientWebSoc) {
      recipientWebSoc.send(
        JSON.stringify({
          type: "MESSAGE_DELETED",
          messageId: messageId,
        })
      );
    } else {
      console.log(
        "Пользователь оффлайн, не может получить уведомление об удалении:",
        to
      );
    }
  }
}

server.on("connection", (ws) => {
  console.log("Новое подключение к сокету");

  ws.on("message", async (message) => {
    try {
      const dataMessage = JSON.parse(message);
      console.log("Получено сообщение типа:", dataMessage.type);

      switch (dataMessage.type) {
        case "LOGIN":
          await handleLogin(dataMessage, ws);
          break;
        case "SEND_MESSAGE":
          console.log("Получено сообщение для отправки:", dataMessage);
          await handleSendMessage(dataMessage);
          break;
        case "SEND_GROUP_MESSAGE":
          console.log(
            "Получено групповое сообщение для отправки:",
            dataMessage
          );
          await handleSendGroupMessage(dataMessage);
          break;
        case "GET_HISTORY":
          await handleGetHistory(dataMessage, ws);
          break;
        case "DELETE_MESSAGE":
          handleDeleteMessage(dataMessage);
          break;
      }
    } catch (error) {
      console.error("Ошибка обработки сообщения:", error);
    }
  });

  ws.on("close", () => {
    // Удаляем пользователя из списка онлайн
    for (const [user, userWs] of onlineUsers.entries()) {
      if (userWs === ws) {
        onlineUsers.delete(user);
        console.log("Пользователь отключился:", user);
        broadcastOnlineUsers();
        break;
      }
    }
  });
});

console.log("WebSocket server is running on ws://localhost:9525");
