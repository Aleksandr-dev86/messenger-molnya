import React, { useEffect, useState } from "react";
import "../body/body.css";
import Users from "../body/users/users";
import UserWindow from "./userWindow/userWindow";
import Message from "../body/message/message";
import GroupCreationModal from "./GroupCreationModal";
import Notification from "./Notification";
import { UseUserContext } from "../search/createContext";
import avatarMessage from "../../img/avatarTest.webp";

const Body = (props) => {
  const [bodyWindow, setBodyWindow] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const { startChat } = UseUserContext();

  function showBodyWindow() {
    setBodyWindow(true);
  }
  function hideBodyWindow() {
    setBodyWindow(false);
  }

  function handleChange(event) {
    let bodyAcide = document.querySelector(".body-aside");
    const bodyLine = document.querySelector(".body_line");

    moveBodyLine(event.pageX);
    function moveBodyLine(pageX) {
      bodyLine.style.left = pageX - 18 - 1 + "px";

      bodyAcide.style.width = pageX - 36 + "px";
    }
    function onMouseMove(event) {
      moveBodyLine(event.pageX);
      if (event.pageX < `225`) {
        bodyLine.style.left = `245px`;
        bodyAcide.style.width = `225px`;
        document.removeEventListener("mousemove", onMouseMove);
      }
      if (event.pageX > `550`) {
        document.removeEventListener("mousemove", onMouseMove);
        bodyLine.style.left = `520px`;
        bodyAcide.style.width = `500px`;
      }
    }

    document.addEventListener("mousemove", onMouseMove);

    document.onmouseup = function () {
      document.removeEventListener("mousemove", onMouseMove);

      document.onmouseup = null;
    };
  }

  const { userName, avatar, setAvatarContext } = UseUserContext();
  const [upload, setUpload] = useState(null);
  useEffect(() => {
    const fetchAvatar = async () => {
      const response = await fetch("http://localhost:80/api/getImg.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName }),
      });
      const data = await response.json();
      // if (!data) {
      //   setAvatarContext(avatarMessage);
      // }
      if (data.success) {
        const imageUrl = `data:image/jpeg;base64,${data.image}`;

        // console.log(data);
        setAvatarContext(imageUrl);

        console.log("изображение полученно");
        // console.log(avatar);
      }

      //  else {
      //   console.log(data.error);
      //   console.log(upload);
      // }
    };

    fetchAvatar();
  });
  // const [recepientNick, setRecipientNick] = useState("");
  // function getDataChat(nick) {
  //   setRecipientNick(nick);
  // }
  // const [startChat, setStartChat] = useState(null);
  // function showChat() {
  //   setStartChat("show");
  // }
  // const [recipientImg, setRecipientImg] = useState(null);
  // function getDataImg(img) {
  //   setRecipientImg(img);
  // }

  // Открыть модальное окно создания группы
  const openGroupModal = () => {
    setShowGroupModal(true);
  };

  // Закрыть модальное окно создания группы
  const closeGroupModal = () => {
    setShowGroupModal(false);
  };

  // Обработчик успешного создания группы
  const handleGroupCreated = (groupName) => {
    closeGroupModal();
    setNotification({
      type: "success",
      message: `Группа "${groupName}" успешно создана!`,
    });
  };

  // Закрыть уведомление
  const closeNotification = () => {
    setNotification(null);
  };

  return (
    <div className="body">
      {bodyWindow && (
        <UserWindow userName={userName} hideBodyWindow={hideBodyWindow} />
      )}

      {showGroupModal && (
        <GroupCreationModal
          onClose={closeGroupModal}
          onSuccess={handleGroupCreated}
        />
      )}

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={closeNotification}
          duration={5000}
        />
      )}

      <div className="body_aside-wrap">
        <aside className="body-aside">
          <div className="body_head">
            <div className="message-chat__header_left">
              <div className="message-chat__avatar">
                <img
                  onClick={showBodyWindow}
                  className="message-chat__img"
                  src={avatar ? avatar : avatarMessage}
                  alt="AvatarInput"
                />
              </div>
              <div className="message-chat__name">{userName}</div>
            </div>
            <button
              className="create-group-button"
              onClick={openGroupModal}
              title="Создать новую группу"
            >
              <i className="fa fa-users"></i>
              <span>создать группу+</span>
            </button>
          </div>
          <ul className="body-contacts">
            <Users
              userName={userName}
              // showChat={showChat}
              // getDataChat={getDataChat}
              // getDataImg={getDataImg}
            />
          </ul>
        </aside>
        <div onMouseDown={handleChange} className="body_line"></div>
      </div>
      <div className="body-chat">
        {startChat == "show" && <Message userName={userName} />}
      </div>
    </div>
  );
};
export default Body;
