<?php
   function connectDB(){
    $serverName='localhost';
    $login = 'root';
    $password='';
    $dbName='diplom';
    $conection = new mysqli($serverName, $login,$password,$dbName); //подключение к базе данных
    //проверка соединения:
    if($conection->connect_error){
        die('неудалось подключиться к серверу'.$conection->connect_error);
    }
    return $conection;
   }

?>