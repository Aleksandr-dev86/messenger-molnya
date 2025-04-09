import React, { useEffect, useState } from "react";
import { UseUserContext } from "../search/createContext";
import "../body/body.css";

const GroupCreationModal = ({ onClose, onSuccess }) => {
  const { userName } = UseUserContext();
  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [usersGroup, setUsersGroup] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Загрузка списка пользователей при монтировании компонента
    const fetchUsers = async () => {
      try {
        const response = await fetch(
          "http://localhost:80/api/getUsersForModal.php"
        );
        const data = await response.json();

        if (data.success) {
          setAllUsers(data.users);
        } else {
          setError("Не удалось загрузить список пользователей");
          console.error(data.message);
        }
      } catch (error) {
        setError("Ошибка при загрузке пользователей");
        console.error("Ошибка при загрузке пользователей:", error);
      }
    };

    fetchUsers();
  }, []);

  // Обновление валидности формы
  useEffect(() => {
    setIsFormValid(
      groupName.trim() !== "" && groupImage !== null && usersGroup.length > 0
    );
  }, [groupName, groupImage, usersGroup]);

  // Фильтрация пользователей при вводе
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers([]);
    } else {
      const filtered = allUsers.filter(
        (user) =>
          user.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !usersGroup.includes(user) &&
          user !== userName
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, allUsers, usersGroup, userName]);

  // Обработка изменения имени группы
  const handleGroupNameChange = (e) => {
    setGroupName(e.target.value);
  };

  // Обработка загрузки изображения
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGroupImage(file);

      // Создаем URL для предпросмотра
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Обработка изменения поиска пользователей
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Добавление пользователя в группу
  const addUserToGroup = (user) => {
    if (!usersGroup.includes(user)) {
      setUsersGroup([...usersGroup, user]);
    }
    setSearchTerm("");
    setFilteredUsers([]);
  };

  // Удаление пользователя из группы
  const removeUserFromGroup = (user) => {
    setUsersGroup(usersGroup.filter((u) => u !== user));
  };

  // Отправка формы для создания группы
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) return;

    setIsCreating(true);
    setError("");

    try {
      // Включаем текущего пользователя в список участников группы
      const allGroupUsers = [...usersGroup];
      if (!allGroupUsers.includes(userName)) {
        allGroupUsers.push(userName);
      }

      // Формируем данные для отправки
      const formData = new FormData();
      formData.append("groupName", groupName);
      formData.append("groupImage", groupImage);
      formData.append("users", allGroupUsers.join(";"));
      formData.append("createdBy", userName);

      const response = await fetch("http://localhost:80/api/createGroup.php", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Успешное создание группы
        if (onSuccess) {
          onSuccess(groupName);
        } else {
          onClose();
        }
      } else {
        setError(data.message || "Ошибка при создании группы");
      }
    } catch (error) {
      setError("Произошла ошибка при создании группы");
      console.error("Ошибка:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Создание новой группы</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="group-form">
          <div className="form-group">
            <label htmlFor="groupName">Название группы</label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={handleGroupNameChange}
              placeholder="Введите название группы"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="groupImage">Изображение группы</label>
            <input
              type="file"
              id="groupImage"
              onChange={handleImageChange}
              accept="image/*"
              required
            />
            {previewImage && (
              <div className="image-preview">
                <img src={previewImage} alt="Предпросмотр" width="100" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="userSearch">Добавить пользователей</label>
            <input
              type="text"
              id="userSearch"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Введите имя пользователя"
            />

            {filteredUsers.length > 0 && (
              <div className="users-dropdown">
                {filteredUsers.map((user, index) => (
                  <div
                    key={index}
                    className="user-item"
                    onClick={() => addUserToGroup(user)}
                  >
                    {user}
                  </div>
                ))}
              </div>
            )}

            {usersGroup.length > 0 && (
              <div className="selected-users">
                {usersGroup.map((user, index) => (
                  <span
                    key={index}
                    className="user-tag"
                    onClick={() => removeUserFromGroup(user)}
                  >
                    {user} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Отмена
            </button>
            <button
              type="submit"
              className="create-button"
              disabled={!isFormValid || isCreating}
            >
              {isCreating ? "Создание..." : "Создать группу"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupCreationModal;
