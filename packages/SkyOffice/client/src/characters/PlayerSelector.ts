import Phaser from 'phaser'
import MyPlayer from './MyPlayer'
import { PlayerBehavior } from '../../../types/PlayerBehavior'
import Item from '../items/Item'
import { NavKeys } from '../../../types/KeyboardState'
export default class PlayerSelector extends Phaser.GameObjects.Zone {
  selectedItem?: Item

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y, width, height)

    scene.physics.add.existing(this)
  }

  update(player: MyPlayer, cursors: NavKeys) {
    if (!cursors) {
      return
    }

 //在坐着时则可能不需要执行某些操作，比如移动、攻击等
    if (player.playerBehavior === PlayerBehavior.SITTING) {
      return
    }

    //更新玩家选择框的位置，使其始终在玩家面前
    const { x, y } = player
    let joystickLeft = false
    let joystickRight = false
    let joystickUp = false
    let joystickDown = false
    if (player.joystickMovement?.isMoving) {
      joystickLeft = player.joystickMovement?.direction.left
      joystickRight = player.joystickMovement?.direction.right
      joystickUp = player.joystickMovement?.direction.up
      joystickDown = player.joystickMovement?.direction.down
    }
    if (cursors.left?.isDown || cursors.A?.isDown || joystickLeft) {
      this.setPosition(x - 32, y)
    } else if (cursors.right?.isDown || cursors.D?.isDown || joystickRight) {
      this.setPosition(x + 32, y)
    } else if (cursors.up?.isDown || cursors.W?.isDown || joystickUp) {
      this.setPosition(x, y - 32)
    } else if (cursors.down?.isDown || cursors.S?.isDown || joystickDown) {
      this.setPosition(x, y + 32)
    }
    //在当前选择项目时，
    //如果选中项和选中项不在选择器的范围，则清除对话框和选中项
    if (this.selectedItem) {
      if (!this.scene.physics.overlap(this, this.selectedItem)) {
        this.selectedItem.clearDialogBox()
        this.selectedItem = undefined
      }
    }
  }
}
