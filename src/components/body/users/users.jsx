import React, { useEffect, useState } from "react";
import "../users/users.css";
import avatarUser from "../../../../src/img/avatarTest.webp";
import { UseUserContext } from "../../search/createContext";

const Users = (props) => {
  const {
    userName,
    setSendGroupContext,
    messageHistory,
    onlineUsers,
    getDataChat,
    showChat,
  } = UseUserContext();
  const [userNiks, setUserNiks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  useEffect(() => {
    if (!Array.isArray(messageHistory) || messageHistory.length === 0) return;

    const newLastMessages = { ...lastMessages };

    // Обрабатываем сообщения для каждого чата
    messageHistory.forEach((msg) => {
      // Определяем ключ для хранения последнего сообщения
      let chatKey;
      let isGroupMessage = msg.isGroup || false;

      if (isGroupMessage) {
        // Для групповых сообщений ключ - имя группы
        chatKey = msg.from === userName ? msg.to : msg.from;
      } else {
        // Для личных сообщений ключ - имя собеседника
        chatKey = msg.from === userName ? msg.to : msg.from;
      }

      // Если собеседник - текущий пользователь, пропускаем
      if (chatKey === userName) return;

      // Получаем текущее последнее сообщение для этого чата
      const currentLastMsg = newLastMessages[chatKey];

      // Если нет последнего сообщения или новое сообщение более позднее
      if (
        !currentLastMsg ||
        new Date(msg.timestamp) > new Date(currentLastMsg.timestamp)
      ) {
        // Сохраняем новое последнее сообщение
        newLastMessages[chatKey] = {
          message: msg.message,
          timestamp: msg.timestamp,
          isGroup: isGroupMessage,
          // Для групповых сообщений сохраняем отправителя
          originalSender: msg.originalSender || msg.from,
        };
      }
    });

    setLastMessages(newLastMessages);
  }, [messageHistory, userName]);

  const formatLastMessage = (username, messageData) => {
    if (!messageData) return "Нет сообщений";

    // Обрезаем длинные сообщения
    const maxLength = 25;
    let messageText = messageData.message;
    if (messageText.length > maxLength) {
      messageText = messageText.substring(0, maxLength) + "...";
    }

    // Для групповых сообщений добавляем имя отправителя
    if (messageData.isGroup) {
      const sender =
        messageData.originalSender === userName
          ? "Вы"
          : messageData.originalSender;
      return `${sender}: ${messageText}`;
    } else {
      // Для личных сообщений
      return messageData.originalSender === userName
        ? `Вы: ${messageText}`
        : messageText;
    }
  };

  const sendSearchData = async () => {
    const response = await fetch(
      "http://localhost:80/api/createUsersList.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/JSON" },
        body: JSON.stringify({ userName: userName }),
      }
    );
    const data = await response.json();
    if (data.success) {
      // Разделяем пользователей и группы
      const users = data.data.filter((item) => !item.isGroup);
      const groupChats = data.data.filter((item) => item.isGroup);
      setUserNiks(users);
      setGroups(groupChats);
    }
  };

  useEffect(() => {
    sendSearchData();
  }, [userName]);

  function handleUserClick(event) {
    const chatUserName = event.currentTarget.getAttribute("data-userName");
    const isGroup = event.currentTarget.getAttribute("data-group") === "true";

    // Устанавливаем флаг отправки сообщения в группу
    setSendGroupContext(isGroup);

    showChat();
    getDataChat(chatUserName, isGroup);
  }

  function isUserOnline(username) {
    return onlineUsers.includes(username);
  }

  return (
    <div>
      {/* Раздел с индивидуальными чатами */}
      <div className="users-section">
        <h3 className="section-title">Пользователи</h3>
        {userNiks.map((el) =>
          el.username !== userName ? (
            <li
              onClick={handleUserClick}
              key={el.username}
              data-userName={el.username}
              data-group="false"
              className="user-contact"
            >
              <div className="user-contact__wrap">
                <div className="user-contact__avatar">
                  <img
                    className="user-contact__img"
                    src={
                      el.img ? `data:image/jpeg;base64,${el.img}` : avatarUser
                    }
                    alt="Загрузите фото"
                  />
                </div>
                <div className="user-content">
                  <div className="user-contact__name">
                    {el.username}{" "}
                    {isUserOnline(el.username) && (
                      <div className="user-point"></div>
                    )}
                  </div>

                  <div className="user-contact__content">
                    {formatLastMessage(el.username, lastMessages[el.username])}
                  </div>
                </div>
              </div>
            </li>
          ) : null
        )}
      </div>
      {/* Раздел с групповыми чатами */}
      {groups.length > 0 && (
        <div className="groups-section">
          <h3 className="section-title">Группы</h3>
          {groups.map((group) => (
            <li
              onClick={handleUserClick}
              key={group.groupId || group.username}
              data-userName={group.username}
              data-group="true"
              className="user-contact"
            >
              <div className="user-contact__wrap">
                <div className="user-contact__avatar">
                  <img
                    className="user-contact__img"
                    src={
                      group.img
                        ? `data:image/jpeg;base64,${group.img}`
                        : avatarUser
                    }
                    alt="Загрузите фото"
                  />
                </div>
                <div className="user-content">
                  <div className="user-contact__name">{group.username}</div>

                  <div className="user-contact__content">
                    {" "}
                    {formatLastMessage(
                      group.username,
                      lastMessages[group.username]
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;
