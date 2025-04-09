import React, { useState } from "react";
import { UseUserContext } from "./createContext";
import "../search/search.css";
const Search = (props) => {
  const [searchInput, setSearchInput] = useState("");

  let [userResponse, setUserResponse] = useState([]);
  const { getDataChat, showChat, userName } = UseUserContext();
  function handleSearchInp(e) {
    const inputValue = e.target.value;
    setSearchInput(inputValue);
    console.log(inputValue);
    sendSearchData(inputValue);
  }

  const sendSearchData = async (inputValue) => {
    const response = await fetch("http://localhost:80/api/addContact.php", {
      method: "POST",
      headers: { "Content-Type": "application/JSON" },
      body: JSON.stringify({ query: inputValue }),
    });

    const data = await response.json();

    if (data.success) {
      // console.log("hello");
      setUserResponse(data.data);
    }
    console.log(userResponse);
  };

  function handleShowChat(userName) {
    showChat();
    getDataChat(userName);
    setSearchInput("");
  }

  return (
    <div className="header-search">
      <form className="header-search__form">
        <input
          onChange={handleSearchInp}
          className="header-search__input"
          type="text"
          placeholder="Поиск контактов"
          value={searchInput}
        />
      </form>
      <div className="contactSearchListWrap">
        <ul className="contactSearchList">
          {searchInput != "" ? (
            userResponse.map((user) =>
              user.name_Ref != userName ? (
                <li
                  onClick={() => handleShowChat(user.name_Ref)}
                  className="contactSearchLi"
                  key={user.id}
                >
                  {user.name_Ref}
                </li>
              ) : null
            )
          ) : (
            <li></li>
          )}
        </ul>
      </div>
    </div>
  );
};
export default Search;
