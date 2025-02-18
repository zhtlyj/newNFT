import { Command } from '@colyseus/command'
import { Client } from 'colyseus'
import { IOfficeState } from '../../../types/IOfficeState'
import { ChatMessage } from '../schema/OfficeState'

type Payload = {
  client: Client   //发送消息的玩家
  content: string  //消息内容
}

//处理聊天消息的更新
export default class ChatMessageUpdateCommand extends Command<IOfficeState, Payload> {
  execute(data: Payload) {
    const { client, content } = data
    const player = this.room.state.players.get(client.sessionId)
    const chatMessages = this.room.state.chatMessages

    if (!chatMessages) return

 // 如果消息数量超过100条，则删除最早的一条消息
    if (chatMessages.length >= 100) chatMessages.shift()

    const newMessage = new ChatMessage() //将newMessage初始化成ChatMessage对象
    newMessage.author = player.name   //给这个对象赋值
    newMessage.content = content        //给这个对象赋值
    chatMessages.push(newMessage)   //将新消息添加到消息列表中
  }
}
