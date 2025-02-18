import http from 'http'    //用于创建HTTP服务器。
import express from 'express'   //Node.js Web应用框架。
import cors from 'cors'   //处理跨域资源共享（CORS）。
import { Server, LobbyRoom } from 'colyseus'   //多人在线游戏服务器框架。
import { monitor } from '@colyseus/monitor'   //Colyseus的监控工具，用于查看房间状态和玩家信息。
import { RoomType } from '../types/Rooms'     //用于定义房间类型。

// import socialRoutes from "@colyseus/social/express"
 
import { SkyOffice } from './rooms/SkyOffice'  

const port = Number(process.env.PORT || 2567)
const app = express()

app.use(cors())
app.use(express.json())
// app.use(express.static('dist'))

const server = http.createServer(app)
const gameServer = new Server({
  server,
})

// 注册房间的类型
gameServer.define(RoomType.LOBBY, LobbyRoom)   //定义一个大厅房间
gameServer.define(RoomType.PUBLIC, SkyOffice, {     //定义一个公共房间，允许任何人加入
  name: '公共大厅',
  description: '这个大厅是为了交友和熟悉游戏控制而设立的',
  password: null,   //设置密码的用途
  autoDispose: false,  //自动销毁房间
})
gameServer.define(RoomType.CUSTOM, SkyOffice).enableRealtimeListing()  //定义一个自定义房间，并启用实时列表功能

/**
 * Register @colyseus/social routes
 *
 * - uncomment if you want to use default authentication (https://docs.colyseus.io/server/authentication/)
 * - also uncomment the import statement
 */
// app.use("/", socialRoutes);

//查看房间状态和玩家信息。
app.use('/colyseus', monitor())  
 
gameServer.listen(port)   //启动Colyseus服务器并监听指定端口。
console.log(`Listening on ws://localhost:${port}`)
