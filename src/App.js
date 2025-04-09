import "./App.css";
import Header from "./components/header/header";
import { useState } from "react";
import Enter from "./components/enter/enter";
import Registration from "./components/registration/registration";
import Body from "./components/body/body";
import HiMenu from "./components/hiMenu/hiMenu";
import { UseUserContext } from "./components/search/createContext";
import { Provider } from "./components/search/createContext";

export function App() {
  const [viewEnter, setViewEnter] = useState("");

  function enterFn() {
    setViewEnter("enter");
  }
  function regFn() {
    setViewEnter("reg");
  }
  function bodyFn() {
    setViewEnter("body");
  }
  const [showSearch, setShowSearch] = useState(false);
  const handleSearch = function () {
    setShowSearch(true);
  };
  const [showMenu, setShowMenu] = useState(false);
  function menu() {
    setShowMenu(true);
  }
  const [showBody, setShowBody] = useState(false);
  function body() {
    setShowBody(true);
  }
  function startWebsocket() {}
  const [showHiMenu, setShowHiMenu] = useState(false);
  function showHi() {
    setShowHiMenu(true);
  }
  const { userName, setUserContext } = UseUserContext();

  return (
    <div className="window">
      <Header
        enterFn={enterFn}
        regFn={regFn}
        showSearch={showSearch}
        showMenu={showMenu}
        hideMenu={setShowMenu}
        setShowSearch={setShowSearch}
        hideBody={setShowBody}
        showHi={showHi}
        showAgainHi={setShowHiMenu}
      />

      {viewEnter === "enter" && (
        <Enter
          bodyFn={bodyFn}
          search={handleSearch}
          setShowMenu={menu}
          hideBody={setShowBody}
          setUserContext={setUserContext}
        />
      )}
      {viewEnter === "reg" && <Registration enterFn={enterFn} regFn={regFn} />}

      {viewEnter === "body" && showBody === false && (
        <Body userName={userName} />
      )}
      {showHiMenu === false && (
        <HiMenu enterFn={enterFn} regFn={regFn} showHi={showHi} />
      )}
    </div>
  );
}
const Main = () => {
  return (
    <Provider>
      <App />
    </Provider>
  );
};

export default Main;
