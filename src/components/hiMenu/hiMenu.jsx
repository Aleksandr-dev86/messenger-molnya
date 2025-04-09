import React from "react";
import "../hiMenu/hiMenu.css";
import liveFlash from "../../img/liveFlash.gif";
import { UseUserContext } from "../search/createContext";

const HiMenu = (props) => {
  const { initWebSocket } = UseUserContext();

  return (
    <div className="wrap-hiMenu">
      <div class="hiMenu">
        <img className="liveFlash" src={liveFlash} alt="" />
        <div className="hiMenu__content">
          <p className="hiMenu-head">
            Добро пожаловать в <span className="hiMenuLogo">Молнию</span>
          </p>
          <div className="hiMenu-choise">
            <p
              onClick={() => {
                props.regFn();
                props.showHi(true);
                initWebSocket();
              }}
              className="hiMenu-ancore"
            >
              Зарегестрируйтесь
            </p>
            <p>и</p>
            <p
              onClick={() => {
                
                props.enterFn();
                props.showHi(true);
              }}
              className="hiMenu-ancore"
            >
              Войдите
            </p>
          </div>
          <p className="slogan">чтобы ускорить своё общение</p>
        </div>
      </div>
    </div>
  );
};
export default HiMenu;
