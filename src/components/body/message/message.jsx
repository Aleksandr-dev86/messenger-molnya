import React, { useState } from "react";
import "./message.css";
import avatarMessage from "../../../img/avatarTest.webp";
import UserChatInput from "./userchatInput/userChatInput";
import ChatSearch from "./chatSearch/chatSearch";
import { UseUserContext } from "../../search/createContext";
import "../message/userMessage/userMessage.css";

const Message = (props) => {
  const { userName, recepientNick } = UseUserContext();
  const [showChatSearchInput, setShowChatSearchInput] = useState(false);

  function handleShowSearch() {
    setShowChatSearchInput(true);
  }

  return (
    <div className="message-chat">
      <div className="message-chat__header">
        <div className="message-chat__header_left">
          <div className="message-chat__avatar">
            <img className="message-chat__img" src={avatarMessage} alt="" />
          </div>
          <div className="message-chat__name">{recepientNick}</div>
        </div>
        {showChatSearchInput && <ChatSearch />}
        <div onClick={handleShowSearch} className="message-chat__header_right">
          <div className="message-chat__header_search"></div>
        </div>
      </div>

      <UserChatInput userName={userName} recepientNick={recepientNick} />
    </div>
  );
};

export default Message;
