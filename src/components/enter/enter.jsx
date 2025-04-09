import React, { useState, useEffect } from "react";
import "../enter/enter.css";
import { UseUserContext } from "../search/createContext";

const Enter = (props) => {
  const { setUserContext, userName, socket, initWebSocket } = UseUserContext();
  const [enterName, setEnterName] = useState("");
  const [enterPassword, setEnterPassword] = useState("");

  // // Инициализируем WebSocket при монтировании компонента
  // useEffect(() => {
  //   // const ws = initWebSocket();

  //   // Закрываем соединение при размонтировании
  //   // return () => {
  //   //   if (ws) {
  //   //     ws.close();
  //   //   }
  //   };
  // }, []);

  const handlelog = (e) => {
    setEnterName(e);
    setUserContext(e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Инициализируем WebSocket и дожидаемся подключения
      const ws = await initWebSocket();

      const response = await fetch("http://localhost:80/api/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enterName, enterPassword }),
      });

      const data = await response.json();
      console.log(data);

      if (data.success) {
        // Используем полученный ws, а не socket из контекста
        ws.send(
          JSON.stringify({
            type: "LOGIN",
            enterName: enterName,
          })
        );

        props.bodyFn();
        props.setShowMenu();
        props.search();
        props.hideBody(false);
      }
    } catch (error) {
      console.error("Ошибка авторизации или подключения WebSocket:", error);
    }
  };

  function handleEnter() {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "LOGIN",
          enterName: enterName,
        })
      );
    } else {
      console.error("WebSocket не подключен");
    }
  }

  return (
    <div className="enter">
      <div className="enter-wrap">
        <p className="reg-logo">High voltage</p>
        <form onSubmit={handleSubmit} action="" className="enter-form">
          <label htmlFor="enter-name">Введите логин</label>
          <input
            required
            onChange={(e) => {
              handlelog(e.target.value);
            }}
            id="enter-name"
            type="text"
          />
          <label htmlFor="enter-password">Введите пароль</label>
          <input
            required
            onChange={(e) => setEnterPassword(e.target.value)}
            id="enter-password"
            type="password"
          />
          <button className="enterButton" type="submit">
            Войти
          </button>
        </form>
        <a className="enter-wrap__forgot" href="#">
          Забыли пароль?
        </a>
      </div>
    </div>
  );
};

export default Enter;
