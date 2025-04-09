import React, { useEffect, useState } from "react";
import "../userWindow/userWindow.css";
import { UseUserContext } from "../../search/createContext";

const UserWindow = (props) => {
  // const userName = props.userName;
  // const [imgPrewUrl, setImgPrewUrl] = useState(null);
  // const [images, setImages] = useState([]);
  // const [choseImg, setChoseImg] = useState(null);
  // const handleChangImg = (event) => {
  //   const files = event.target.files[0];
  //   setChoseImg(files);
  //   console.log(files);
  //   if (files) {
  //     const url = URL.createObjectURL(files);
  //     setImgPrewUrl(url);
  //     console.log(url);
  //   }
  // };
  // const setImg = async () => {
  //   if (!choseImg) {
  //     alert("выберите изображение");
  //     return;
  //   }
  //   const formData = new FormData();
  //   formData.append("image", choseImg);
  //   formData.append("userName", userName);
  //   // подготовка запроса
  //   const response = await fetch("http://localhost:80/api/imgLoader.php", {
  //     method: "POST",
  //     body: formData,
  //   });
  //   // отправляем на бэк
  //   const dataResponse = await response.json();
  //   console.log(userName);
  //   if (dataResponse.success) {
  //     console.log("изображение загруженно");
  //     setImgPrewUrl(null);
  //     setChoseImg(null);
  //   } else {
  //     console.log("ошибка при загрузке изображения", dataResponse.error);
  //   }
  // };
  // const fetchImages = async () => {
  //   try {
  //     const response = await fetch("http://localhost:80/api/getImg.php");
  //     const text = await response.text(); // Получаем текстовый ответ
  //     // console.log("Ответ от сервера:", text); // Выводим ответ в консоль
  //     const data = JSON.parse(text); // Парсим текст как JSON
  //     if (data.success) {
  //       setImages(data.images);
  //       console.log(data.images);
  //     } else {
  //       console.error("Ошибка при получении изображений:", data.error);
  //     }
  //   } catch (error) {
  //     console.error("Ошибка при загрузке изображений:", error);
  //   }
  // };
  // useEffect(() => {
  //   fetchImages();
  // }, []);
  // return (
  //   <div className="userWindow">
  //     <div className="userWindow_head"></div>
  //     <div className="userWindow_body">
  //       <input onChange={handleChangImg} type="file" accept="image/*" />
  //       <div className="userWindow_preShow">
  //         {images.map((image, index) => (
  //           <img
  //             key={index}
  //             src={`data:image/jpeg;base64,${image.code}`} // Используем base64-код
  //             alt={`Image ${index + 1}`}
  //             style={{ width: "500px", height: "auto", margin: "10px" }}
  //           />
  //         ))}
  //       </div>
  //       <button onClick={setImg} className="userWindow_btn-load">
  //         Загрузить
  //       </button>
  //     </div>
  //     <div className="hideBodyWindow" onClick={props.hideBodyWindow}>
  //       x
  //     </div>
  //   </div>
  // );
  //============================================================
  const { userName, setAvatarContext, avatar } = UseUserContext();
  function showHideAvatar() {
    setAvatarContext(avatar);
    props.hideBodyWindow();
  }
  // console.log(userName);
  const [selectedFile, setSelectedFile] = useState(null);
  const [upload, setUpload] = useState(null);

  const [prevUrlImage, setPrevUrlImage] = useState(null);

  const handleImageChange = (event) => {
    const picFile = event.target.files[0];
    setSelectedFile(picFile);

    if (picFile) {
      const url = URL.createObjectURL(picFile);

      setPrevUrlImage(url);
    }
  };
  // console.log(prevUrlImage);
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Пожалуйста, выберите изображение для загрузки.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("userName", userName);
    // console.log(formData);
    // console.log(picFile);
    // console.log(formData);
    const response = await fetch("http://localhost:80/api/imgLoader.php", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setUpload(data);

    if (data.success) {
      console.log("Изображение успешно загружено!");
    } else {
      console.log("Ошибка при загрузке изображения.");
    }

    props.hideBodyWindow();
    // console.log(userName);
    // console.log(JSON.stringify(userName));
  };

  return (
    <div className="userWindow">
      <div className="userWindow_head">
        {" "}
        <div className="hideBodyWindow" onClick={showHideAvatar}>
          x
        </div>
        <p className="userWindow-text">
          Друзьям будет проще узнать вас, если вы загрузите свою настоящую
          фотографию. Вы можете загрузить изображение в формате JPG, GIF, PNG,
          WEBP.
        </p>
      </div>
      <div className="userWindow_body">
        <input
          className="userWindowInput"
          onChange={handleImageChange}
          type="file"
          accept="image/*"
        />{" "}
      </div>{" "}
      <div className="userWindow_preShow">
        <img
          // key={index}
          src={prevUrlImage}
          alt="#"
          // style={{ width: "500px", height: "auto", margin: "10px" }}
          className="userWindow_preShow-img"
        />
      </div>{" "}
      <button onClick={handleUpload} className="userWindow_btn-load">
        Загрузить
      </button>{" "}
      <p className="userWindow-text">
        Eсли у вас возникают проблемы с загрузкой, попробуйте выбрать фотографию
        меньшего размера.
      </p>
    </div>
  );
};

export default UserWindow;
