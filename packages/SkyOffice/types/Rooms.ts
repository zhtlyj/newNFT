//定义房间类型的接口
export enum RoomType {
  LOBBY = 'lobby',     //大厅
  PUBLIC = 'skyoffice',   //公开房间
  CUSTOM = 'custom',    //自定义房间
}

//定义房间数据的接口
export interface IRoomData {
  name: string
  description: string
  password: string | null
  autoDispose: boolean   //自动销毁
}
