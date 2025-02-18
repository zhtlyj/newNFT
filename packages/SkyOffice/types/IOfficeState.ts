import { Schema, ArraySchema, SetSchema, MapSchema } from '@colyseus/schema'

export interface IPlayer extends Schema {
  name: string      //玩家名称
  x: number       //玩家位置x
  y: number       //玩家位置y
  anim: string    //动画状态
  readyToConnect: boolean    //玩家是否准备连接
  videoConnected: boolean   //玩家视频是否已连接
}

export interface IComputer extends Schema {
  connectedUser: SetSchema<string>   //已连接的用户
}

export interface IWhiteboard extends Schema {
  roomId: string        //白板房间id
  connectedUser: SetSchema<string>   //已连接的用户
}

export interface IChatMessage extends Schema {
  author: string      //消息发送者
  createdAt: number   //消息创建的时间戳
  content: string     //消息的内容
}

export interface IOfficeState extends Schema {
  players: MapSchema<IPlayer>    //玩家集合
  computers: MapSchema<IComputer>  //电脑集合
  whiteboards: MapSchema<IWhiteboard>  //白板集合
  chatMessages: ArraySchema<IChatMessage>  //聊天消息集合
}
