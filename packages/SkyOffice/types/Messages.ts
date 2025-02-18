export enum Message {
  UPDATE_PLAYER,   //更新玩家信息
  UPDATE_PLAYER_NAME,  //更新玩家名称
  READY_TO_CONNECT,    //准备连接
  DISCONNECT_STREAM,   //断开流
  CONNECT_TO_COMPUTER,  //连接到计算机
  DISCONNECT_FROM_COMPUTER,  //从计算机断开连接
  STOP_SCREEN_SHARE,    //停止屏幕共享
  CONNECT_TO_WHITEBOARD,  //连接到白板
  DISCONNECT_FROM_WHITEBOARD,  //从白板断开连接
  VIDEO_CONNECTED,     //视频已连接
  ADD_CHAT_MESSAGE,     //添加聊天消息
  SEND_ROOM_DATA,      //发送房间数据
} 
