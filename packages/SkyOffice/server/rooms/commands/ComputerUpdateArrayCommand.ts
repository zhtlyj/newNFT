import { Command } from '@colyseus/command'
import { Client } from 'colyseus'
import { IOfficeState } from '../../../types/IOfficeState'

type Payload = {
  client: Client       
  computerId: string   
}

//计算机添加用户命令
export class ComputerAddUserCommand extends Command<IOfficeState, Payload> {
  execute(data: Payload) {
    const { client, computerId } = data
    const computer = this.room.state.computers.get(computerId)
    const clientId = client.sessionId

    if (!computer || computer.connectedUser.has(clientId)) return
    computer.connectedUser.add(clientId)
  }
}

//计算机移除用户的命令
export class ComputerRemoveUserCommand extends Command<IOfficeState, Payload> {
  execute(data: Payload) {
    const { client, computerId } = data
    const computer = this.state.computers.get(computerId)

    if (computer.connectedUser.has(client.sessionId)) {
      computer.connectedUser.delete(client.sessionId)
    }
  }
}
