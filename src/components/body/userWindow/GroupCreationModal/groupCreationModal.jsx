import React, { useEffect, useState } from "react";

const GroupCreationModal = ({ userName }, { onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(
          "http://localhost:80/api/getUsersForGroup.php"
        );
        const data = await response.json();
        if (data.success) {
          setUsers(data.users.filter((user) => user != userName));
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchUsers();
  }, [userName]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setGroupImage(file);
  };
  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) =>
      prev.includes(user) ? prev.filter((u) => u != user) : [...prev, user]
    );
  };
  const handleCreateGroup = async () => {
    if (!groupName || selectedUsers.length == 0) {
      alert("введите название группы и выберите пользователей");
      return;
    }
    const formData = new FormData();
    formData.append("groupName", groupName);
    formData.append("userName", userName);
    formData.append("users", selectedUsers.join(";"));
    if (groupImage) {
      groupImage.append("groupImage", groupImage);
    }
    try {
      const response = await fetch("http://localhost:80/api/createGroup.php", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        alert("группа успешно создана");
        onclose();
      } else {
        console.log("ошибка создания группы");
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="group-modal-overlay">
      <div className="group-modal-content">
        <h2>Добавление группы</h2>

        <div className="group-modal-input">
          <label>Название группы</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Введите название группы"
          />
        </div>

        <div className="group-modal-input">
          <label>Изображение группы</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        <div className="group-modal-users">
          <h3>Выберите пользователей</h3>
          <div className="users-list">
            {users.map((user) => (
              <div key={user} className="user-item">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user)}
                  onChange={() => toggleUserSelection(user)}
                />
                <span>{user}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="group-modal-actions">
          <button onClick={handleCreateGroup}>ОК</button>
          <button onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
};

export default GroupCreationModal;
