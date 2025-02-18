import Phaser from 'phaser'
import Player from './Player'
import MyPlayer from './MyPlayer'
import { sittingShiftData } from './Player'
import WebRTC from '../web/WebRTC'
import { Event, phaserEvents } from '../events/EventCenter'

export default class OtherPlayer extends Player {
  private targetPosition: [number, number]
  private lastUpdateTimestamp?: number
  private connectionBufferTime = 0
  private connected = false
  private playContainerBody: Phaser.Physics.Arcade.Body
  private myPlayer?: MyPlayer

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    id: string,
    name: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, id, frame)
    this.targetPosition = [x, y]

    this.playerName.setText(name)
    this.playContainerBody = this.playerContainer.body as Phaser.Physics.Arcade.Body
  }

  makeCall(myPlayer: MyPlayer, webRTC: WebRTC) {
    this.myPlayer = myPlayer
    const myPlayerId = myPlayer.playerId
    if (
      !this.connected &&
      this.connectionBufferTime >= 750 &&
      myPlayer.readyToConnect &&
      this.readyToConnect &&
      myPlayer.videoConnected &&
      myPlayerId > this.playerId
    ) {
      webRTC.connectToNewUser(this.playerId)
      this.connected = true
      this.connectionBufferTime = 0
    }
  }

  updateOtherPlayer(field: string, value: number | string | boolean) {
    switch (field) {
      case 'name':
        if (typeof value === 'string') {
          this.playerName.setText(value)
        }
        break

      case 'x':
        if (typeof value === 'number') {
          this.targetPosition[0] = value
        }
        break

      case 'y':
        if (typeof value === 'number') {
          this.targetPosition[1] = value
        }
        break

      case 'anim':
        if (typeof value === 'string') {
          this.anims.play(value, true)
        }
        break

      case 'readyToConnect':
        if (typeof value === 'boolean') {
          this.readyToConnect = value
        }
        break

      case 'videoConnected':
        if (typeof value === 'boolean') {
          this.videoConnected = value
        }
        break
    }
  }

  destroy(fromScene?: boolean) {
    this.playerContainer.destroy()

    super.destroy(fromScene)
  }

//preUpdate 是为每个游戏对象的每个帧调用的,用于处理游戏逻辑和更新游戏对象的状态
  preUpdate(t: number, dt: number) {
    super.preUpdate(t, dt)

    // 在需要平滑移动角色时。通过限制更新频率（750 毫秒），可以减少不必要的计算和渲染，提高游戏性能X
    if (this.lastUpdateTimestamp && t - this.lastUpdateTimestamp > 750) {
      this.lastUpdateTimestamp = t
      this.x = this.targetPosition[0]
      this.y = this.targetPosition[1]
      this.playerContainer.x = this.targetPosition[0]
      this.playerContainer.y = this.targetPosition[1] - 30
      return
    }

    this.lastUpdateTimestamp = t
    this.setDepth(this.y) // 更改玩家深度基于玩家的y值
    const animParts = this.anims.currentAnim.key.split('_')
    const animState = animParts[1]
    if (animState === 'sit') {
      const animDir = animParts[2]
      const sittingShift = sittingShiftData[animDir]
      if (sittingShift) {
        // 如果玩家坐下，设置硬编码深度(方向之间的差异)
        this.setDepth(this.depth + sittingShiftData[animDir][2])
      }
    }

    const speed = 200   //速度以每秒像素为单位
    const delta = (speed / 1000) * dt   //玩家在帧中可以移动的最小距离(dt以毫秒为单位)
    let dx = this.targetPosition[0] - this.x
    let dy = this.targetPosition[1] - this.y

    // 如果玩家距离目标位置足够近，直接将玩家拉到那个位置。
    if (Math.abs(dx) < delta) {
      this.x = this.targetPosition[0]
      this.playerContainer.x = this.targetPosition[0]
      dx = 0
    }
    if (Math.abs(dy) < delta) {
      this.y = this.targetPosition[1]
      this.playerContainer.y = this.targetPosition[1] - 30
      dy = 0
    }

    //如果玩家离目标位置还很远，向目标施加恒定速度
    let vx = 0
    let vy = 0
    if (dx > 0) vx += speed
    else if (dx < 0) vx -= speed
    if (dy > 0) vy += speed
    else if (dy < 0) vy -= speed

     //更新角色速度
    this.setVelocity(vx, vy)
    this.body.velocity.setLength(speed)
    //也更新 playerNameContainer 速度
    this.playContainerBody.setVelocity(vx, vy)
    this.playContainerBody.velocity.setLength(speed)
  //在游戏或应用程序中检测玩家是否长时间未活动或未满足特定条件，从而触发玩家断开连接的逻辑
    this.connectionBufferTime += dt
    if (
      this.connected &&
      !this.body.embedded &&
      this.body.touching.none &&
      this.connectionBufferTime >= 750
    ) {
      if (this.x < 610 && this.y > 515 && this.myPlayer!.x < 610 && this.myPlayer!.y > 515) return
      phaserEvents.emit(Event.PLAYER_DISCONNECTED, this.playerId)
      this.connectionBufferTime = 0
      this.connected = false
    }
  }
}

declare global {
  namespace Phaser.GameObjects {
    interface GameObjectFactory {
      otherPlayer(
        x: number,   //对象在场景中的x位置
        y: number,   //对象在场景中的y位置
        texture: string,  //对象的纹理
        id: string,   //对象的id
        name: string,  //对象的名称
        frame?: string | number  //纹理中的特定帧
      ): OtherPlayer
    }
  }
}

//当调用this.add.otherPlayer时，会执行下列的方法 然后，它启用了对象的物理属性，并设置了碰撞体积和偏移量，最后返回了创建的对象。
Phaser.GameObjects.GameObjectFactory.register(
  'otherPlayer',
  function (
    this: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    texture: string,
    id: string,
    name: string,
    frame?: string | number
  ) {
    const sprite = new OtherPlayer(this.scene, x, y, texture, id, name, frame)

    this.displayList.add(sprite)
    this.updateList.add(sprite)

    this.scene.physics.world.enableBody(sprite, Phaser.Physics.Arcade.DYNAMIC_BODY)

    const collisionScale = [6, 4]
    sprite.body
      .setSize(sprite.width * collisionScale[0], sprite.height * collisionScale[1])
      .setOffset(
        sprite.width * (1 - collisionScale[0]) * 0.5,
        sprite.height * (1 - collisionScale[1]) * 0.5 + 17
      )

    return sprite
  }
)
