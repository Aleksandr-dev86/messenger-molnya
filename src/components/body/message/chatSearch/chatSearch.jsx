import React from "react";
import "../chatSearch/chatSearch.css";

const ChatSearch = () => {
  return (
    <div className="chatSearch">
      <form className="chatSearch__form">
        <input placeholder="Поиск" id="chatSearch__input" type="text" />
      </form>
    </div>
  );
};
export default ChatSearch;
