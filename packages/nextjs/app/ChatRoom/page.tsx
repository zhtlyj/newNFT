"use client";

import { useState, useEffect } from "react";

const ChatRoom = () => {
  useEffect(() => {
    // 在客户端添加样式
    const styles = `
      @keyframes neon {
        0%, 100% {
          opacity: 1;
          transform: translateX(0);
        }
        50% {
          opacity: 0.5;
          transform: translateX(10px);
        }
      }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // 清理函数
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);
  return (
    <div className="flex flex-col items-center w-full h-screen">
      <div className="w-full h-full">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          name="waseePanorama"
          scrolling="no"
          src="http://localhost:5173/"
          allow="camera; microphone; fullscreen"
        ></iframe>

      </div>
    </div>
  );
};

export default ChatRoom;
