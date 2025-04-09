import React, { useEffect, useState, useRef } from "react";
import "../userchatInput/userChatInput.css";
import { UseUserContext } from "../../../search/createContext";

const UserChatInput = ({ userName, recepientNick }) => {
  const [message, setMessage] = useState("");
  const {
    socket,
    messageHistory,
    addMessageToHistory,
    setMessageHistory: setMessageHistoryContext,
    sendGroup, // Получаем флаг группового сообщения из контекста
  } = UseUserContext();
  const messagesContainerRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  // Данные для отладки
  const [debugInfo, setDebugInfo] = useState({ visible: false, data: null });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      send();
      // Создаем объект сообщения и добавляем в историю
      const newMessageObject = {
        from: userName,
        to: recepientNick,
        message: message,
        timestamp: new Date().toISOString(),
        type: "sent",
        isGroup: sendGroup, // Добавляем флаг группового сообщения
      };
      addMessageToHistory(newMessageObject);
      setMessage(""); // Очищаем поле ввода
    }
  };

  function send() {
    // Проверяем, является ли сообщение групповым
    if (sendGroup) {
      // Отправляем сообщение с типом SEND_GROUP_MESSAGE
      socket.send(
        JSON.stringify({
          type: "SEND_GROUP_MESSAGE",
          message: message,
          from: userName,
          to: recepientNick, // Имя группы
          groupName: recepientNick,
        })
      );
    } else {
      // Отправляем личное сообщение как раньше
      socket.send(
        JSON.stringify({
          type: "SEND_MESSAGE",
          message: message,
          from: userName,
          to: recepientNick,
        })
      );
    }
  }

  // Прокрутка к последнему сообщению при обновлении истории
  useEffect(() => {
    if (messagesContainerRef.current) {
      // Прокрутка к самому низу контейнера
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messageHistory]);

  // Функция для подтверждения удаления
  const confirmDeleteMessage = (msg) => {
    setMessageToDelete(msg);
    setShowModal(true);
  };

  // Функция для удаления сообщения
  const deleteMessage = async () => {
    // if (!messageToDelete || !messageToDelete.id) {
    //   console.error("ID сообщения не определен");
    //   setShowModal(false);
    //   return;
    // }

    try {
      const response = await fetch("http://localhost:80/api/dellMessage.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageId: messageToDelete.id }),
      });

      const responseData = await response.json();

      if (responseData.success) {
        // Уведомляем сервер WebSocket о том, что сообщение было удалено
        socket.send(
          JSON.stringify({
            type: "DELETE_MESSAGE",
            messageId: messageToDelete.id,
            from: userName,
            to: recepientNick,
            isGroup: messageToDelete.isGroup, // Добавляем флаг группового сообщения
          })
        );

        // Обновляем локально, удаляя сообщение из истории
        const updatedHistory = messageHistory.filter(
          (msg) => msg.id !== messageToDelete.id
        );
        setMessageHistoryContext(updatedHistory);
      } else {
        console.error("Ошибка при удалении сообщения:", responseData.error);
      }
    } catch (error) {
      console.error("Ошибка при выполнении запроса на удаление:", error);
    }

    setShowModal(false);
  };

  // Фильтруем сообщения, относящиеся к текущему чату
  const filteredMessages = messageHistory.filter((msg) => {
    // console.log("Проверка сообщения:", msg, "sendGroup:", sendGroup, "recepientNick:", recepientNick);

    if (sendGroup) {
      // Для групповых чатов показываем:
      // 1. Сообщения отправленные в эту группу (to === имя группы)
      // 2. Сообщения полученные от группы (from === имя группы)
      return msg.to === recepientNick || msg.from === recepientNick;
    } else {
      // Для личных чатов показываем сообщения между двумя пользователями
      return (
        (msg.from === userName && msg.to === recepientNick && !msg.isGroup) ||
        (msg.from === recepientNick && msg.to === userName && !msg.isGroup)
      );
    }
  });

  // Функция для отображения отладочной информации
  const toggleDebugInfo = () => {
    setDebugInfo((prev) => ({
      visible: !prev.visible,
      data: {
        messageHistory: messageHistory,
        filteredMessages: filteredMessages,
        sendGroup: sendGroup,
        recepientNick: recepientNick,
      },
    }));
  };

  return (
    <div className="userChatInput">
      {/* Кнопка для отображения отладочной информации */}
      {/* <button
        onClick={toggleDebugInfo}
        style={{
          position: "absolute",
          top: "5px",
          right: "5px",
          fontSize: "10px",
        }}
      >
        Debug
      </button> */}

      {/* Отладочная информация */}
      {debugInfo.visible && (
        <div
          style={{
            position: "absolute",
            top: "30px",
            right: "5px",
            background: "#f0f0f0",
            padding: "10px",
            borderRadius: "5px",
            zIndex: 1000,
            fontSize: "10px",
            maxHeight: "200px",
            overflow: "auto",
            maxWidth: "300px",
          }}
        >
          <pre>{JSON.stringify(debugInfo.data, null, 2)}</pre>
          <button
            onClick={() =>
              setDebugInfo((prev) => ({ ...prev, visible: false }))
            }
          >
            Close
          </button>
        </div>
      )}

      <div className="messages" ref={messagesContainerRef}>
        <div className="message-chatmessage">
          {filteredMessages.map((msg, index) => {
            // Определяем, является ли сообщение отправленным текущим пользователем
            const isSent = sendGroup
              ? msg.from === userName || msg.originalSender === userName
              : msg.from === userName;

            // Определяем имя отправителя для групповых сообщений
            // Если есть originalSender, используем его, иначе используем from
            const senderName = msg.originalSender || msg.from;

            return (
              <div
                key={index}
                className={`userMessage ${isSent ? "sent" : "received"}`}
                data-message-id={msg.id}
              >
                {/* Для групповых сообщений показываем отправителя */}
                {sendGroup && !isSent && (
                  <div className="userMessage-sender">{senderName}</div>
                )}
                <p className="userMessage-content">{msg.message}</p>
                <div className="userMessage-footer">
                  <p className="userMessage-contenttime">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>

                  {
                    <button
                      className="userMessage-delete"
                      onClick={() => confirmDeleteMessage(msg)}
                    >
                      ✕
                    </button>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Модальное окно подтверждения удаления */}
      {showModal && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <p>Вы действительно хотите удалить это сообщение?</p>
            <div className="delete-modal-buttons">
              <button onClick={deleteMessage}>Ок</button>
              <button onClick={() => setShowModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="userChatInput-form">
        <input
          placeholder={
            sendGroup
              ? `Сообщение в группу ${recepientNick}`
              : `Сообщение для ${recepientNick}`
          }
          id="userChatInput__input"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="userChatInput-button" type="submit">
          Send
        </button>
      </form>
    </div>
  );
};

export default UserChatInput;
