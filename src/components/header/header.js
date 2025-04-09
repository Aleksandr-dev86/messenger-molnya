import React from "react";

import "./header.css";
import logotype from "../../img/logo.webp";
import thunderX from "../../img/thunderX.gif";

import Search from "../search/search";

const Header = (props) => {
  const refreshApp = () => window.location.reload(true);
  return (
    <div>
      <header className="header">
        <div className="header-logo">
          <img className="header-logo__img" src={logotype} alt="..." />
        </div>
        {props.showSearch === true && <Search />}
        {props.showMenu ? (
          <div className="header-menu">
            <div
              onClick={() => {
                {
                  refreshApp();
                }
                props.hideMenu(false);
                props.setShowSearch(false);
                props.hideBody(true);
                props.showAgainHi(false);
              }}
              className="header-menu__in"
            >
              Выйти
              <img src={thunderX} className="imgClose"></img>
            </div>
          </div>
        ) : (
          <div className="header-menu">
            <div
              onClick={() => {
                props.regFn();
                props.showHi(true);
              }}
              className="header-menu__reg"
            >
              Зарегистрироваться
            </div>
            <div
              onClick={() => {
                props.enterFn();
                props.showHi(true);
              }}
              className="header-menu__in"
            >
              Войти
            </div>
          </div>
        )}
      </header>
    </div>
  );
};

export default Header;
