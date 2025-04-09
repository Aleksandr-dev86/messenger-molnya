import React, { useEffect } from "react";
import "../body/body.css";

const Notification = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    // Автоматически закрыть уведомление через указанное время
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    // Очистка таймера при размонтировании компонента
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-content">
        <div className="notification-icon">
          {type === "success" && <span>✓</span>}
          {type === "error" && <span>✕</span>}
          {type === "warning" && <span>!</span>}
          {type === "info" && <span>i</span>}
        </div>
        <p className="notification-message">{message}</p>
      </div>
      <button className="notification-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

export default Notification;