import React, { useState } from "react";
import "./registration.css";
import Search from "../search/search";

const Registration = (props) => {
  const [userName, stateUserName] = useState("");
  const [userMail, stateUserMail] = useState("");
  const [userPassword, stateUserPassword] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("http://localhost:80/api/adduser.php", {
      method: "POST",
      headers: { "Content-Type": "application/JSON" },
      body: JSON.stringify({ userName, userPassword, userMail }),
    });
    const data = await response.json();
    if (data.success) {
      props.enterFn();
    }
    console.log(data);
  };
  return (
    <div className="reg">
      <div className="reg-wrap">
        <p className="reg-logo">High voltage</p>
        <form onSubmit={handleSubmit} action="" className="reg-form">
          <label for="reg-name">Введите логин</label>
          <input
            required
            onChange={(e) => stateUserName(e.target.value)}
            id="reg-name"
            type="text"
          />
          <label for="reg-password">Введите пароль</label>
          <input
            required
            onChange={(e) => stateUserPassword(e.target.value)}
            id="reg-password"
            type="password"
          />
          <label for="reg-mail">Введите Email</label>
          <input
            required
            onChange={(e) => stateUserMail(e.target.value)}
            id="reg-mail"
            type="mail"
          />
          <button className="enterButton" type="submit">
            Зарегестрироваться
          </button>
        </form>
        <a className="enter-wrap__forgot" href="#">
          Забыли пароль?
        </a>
      </div>
    </div>
  );
};

export default Registration;
