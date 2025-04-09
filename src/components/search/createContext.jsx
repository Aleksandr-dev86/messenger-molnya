import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext("Without Provider");

export const Provider = ({ children }) => {
  const [recepientNick, setRecipientNick] = useState("");
  function getDataChat(nick) {
    setRecipientNick(nick);
  }
  const [startChat, setStartChat] = useState(null);
  function showChat() {
    setStartChat("show");
  }

  const [avatar, setAvatar] = useState(null);
  const [userName, setUserName] = useState("");
  const [socket, setSocket] = useState(null);
  const [resivMessage, setResiveMessage] = useState("");
  // Добавляем массив для хранения всех сообщений
  const [messageHistory, setMessageHistory] = useState([]);
  // Добавляем флаг для определения типа отправки сообщения (личное или групповое)
  const [sendGroup, setSendGroup] = useState(false);

  const [onlineUsers, setOnlineUsers] = useState([]);

  function setAvatarContext(avatar) {
    setAvatar(avatar);
  }

  function setUserContext(userName) {
    setUserName(userName);
  }

  function setMessageHistoryContext(messages) {
    setMessageHistory(messages);
  }

  function setWebSocketCon(ws) {
    setSocket(ws);
  }

  function changeMessageState(message) {
    setResiveMessage(message);
  }

  // Устанавливаем флаг группового сообщения
  function setSendGroupContext(isGroup) {
    setSendGroup(isGroup);
  }

  // Добавляем сообщение в историю с проверкой типа данных
  function addMessageToHistory(messageObject) {
    setMessageHistory((prevHistory) =>
      Array.isArray(prevHistory)
        ? [...prevHistory, messageObject]
        : [messageObject]
    );
  }

  // Удаление сообщения из истории
  function removeMessageFromHistory(messageId) {
    setMessageHistory((prevHistory) =>
      Array.isArray(prevHistory)
        ? prevHistory.filter((msg) => msg.id !== messageId)
        : []
    );
  }

  function initWebSocket() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket("ws://localhost:9525");

      ws.onopen = () => {
        console.log("соединение открыто");
        // Сначала сохраняем соединение
        setSocket(ws);

        // Затем запрашиваем историю сообщений
        if (userName) {
          fetch(
            `http://localhost:80/api/getMSG.php?userName=${encodeURIComponent(
              userName
            )}`
          )
            .then((response) => response.json())
            .then((data) => {
              if (data.success && Array.isArray(data.messages)) {
                console.log("Получена история сообщений:", data.messages);
                setMessageHistory(data.messages);
              }
              resolve(ws);
            })
            .catch((error) => {
              console.error("Ошибка при запросе истории сообщений:", error);
              resolve(ws);
            });
        } else {
          resolve(ws);
        }
      };

      ws.onmessage = (event) => {
        console.log("Получили данные", event.data);
        try {
          const data = JSON.parse(event.data);
          console.log("Распарсили", data);
          switch (data.type) {
            case "MESSAGE":
            case "GROUP_MESSAGE":
              console.log("Получено сообщение:", data.message);
              // Создаем объект сообщения и добавляем в историю
              const receivedMessage = {
                id: data.id, // Добавляем ID сообщения
                from: data.from,
                to: data.to,
                message: data.message,
                timestamp: data.timestamp || new Date().toISOString(),
                isGroup: data.type === "GROUP_MESSAGE", // Добавляем флаг группового сообщения
                originalSender: data.originalSender || null, // Добавляем поле originalSender, если оно есть
              };
              addMessageToHistory(receivedMessage);
              setResiveMessage(data.message);
              break;
            case "MESSAGE_SENT":
            case "GROUP_MESSAGE_SENT":
              // Подтверждение отправки сообщения
              console.log("Сообщение отправлено:", data.message);
              // Обновляем сообщение в истории, добавляя ID
              if (data.message) {
                const updatedMessage = {
                  ...data.message,
                  id: data.message.id,
                  isGroup: data.type === "GROUP_MESSAGE_SENT", // Добавляем флаг группового сообщения
                  originalSender: data.message.originalSender || null, // Добавляем поле originalSender, если оно есть
                };
                // Обновляем последнее отправленное сообщение с полученным ID
                updateMessageWithId(updatedMessage);
              }
              break;
            case "HISTORY_MESSAGES":
              // Получаем историю сообщений с сервера
              console.log(
                "Получена история сообщений через WebSocket:",
                data.messages
              );
              // Проверяем, что полученные данные являются массивом
              if (Array.isArray(data.messages)) {
                // Обрабатываем все сообщения, чтобы обеспечить наличие поля originalSender
                const processedMessages = data.messages.map((msg) => ({
                  ...msg,
                  originalSender: msg.originalSender || null,
                }));
                setMessageHistory(processedMessages);
              } else {
                console.error(
                  "Полученная история сообщений не является массивом:",
                  data.messages
                );
                setMessageHistory([]);
              }
              break;
            case "MESSAGE_DELETED":
              // Обработка уведомления об удалении сообщения
              console.log(
                "Получено уведомление об удалении сообщения:",
                data.messageId
              );
              // Удаляем сообщение из истории
              removeMessageFromHistory(data.messageId);
              break;
            case "ONLINE_USERS":
              setOnlineUsers(data.users);
          }
        } catch (error) {
          console.error("Ошибка при обработке данных от сервера:", error);
        }
      };

      ws.onerror = (error) => {
        console.log(`ошибка соединения: ${error}`);
        reject(error);
      };

      ws.onclose = () => {
        console.log("соединение закрыто");
      };

      // Устанавливаем таймаут на случай, если соединение не установится в течение 5 секунд
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          reject(new Error("Тайм-аут при подключении к WebSocket"));
        }
      }, 5000);
    });
  }

  // Обновление сообщения с ID после сохранения в БД
  function updateMessageWithId(messageWithId) {
    setMessageHistory((prevHistory) => {
      if (!Array.isArray(prevHistory)) return [messageWithId];

      // Находим соответствующее сообщение и обновляем его с ID
      return prevHistory.map((msg) => {
        if (
          msg.from === messageWithId.from &&
          msg.to === messageWithId.to &&
          msg.message === messageWithId.message &&
          !msg.id
        ) {
          return {
            ...msg,
            id: messageWithId.id,
            isGroup: messageWithId.isGroup,
            originalSender:
              messageWithId.originalSender || msg.originalSender || null,
          };
        }
        return msg;
      });
    });
  }

  function closeSocket(ws) {
    if (ws) {
      ws.close();
      setSocket(null);
    }
  }

  return (
    <UserContext.Provider
      value={{
        setUserContext,
        userName,
        setAvatarContext,
        avatar,
        setWebSocketCon,
        initWebSocket,
        socket,
        setSocket,
        resivMessage,
        messageHistory,
        addMessageToHistory,
        removeMessageFromHistory,
        setMessageHistory: setMessageHistoryContext,
        sendGroup,
        setSendGroupContext,
        onlineUsers,
        recepientNick,
        getDataChat,
        startChat,
        showChat,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const UseUserContext = () => {
  return useContext(UserContext);
};
