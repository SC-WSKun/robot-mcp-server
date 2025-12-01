import { CMD_VEL_TOPIC_OPTION } from '../../const/topic.option.js'
import { FoxgloveService } from './index.js'

/**
 * A simple service for controlling robot moving
 * And it depends on the foxglove client init by the foxglove service
 */
export class BaseService {
  private static isMovingAdv: boolean = false
  /**
   * do robot moving
   * @param linearSpeed linear speed
   * @param angularSpeed angular speed
   * @returns action result
   */
  public static async moving(linearSpeed: number, angularSpeed: number) {
    const foxgloveService = FoxgloveService.getInstance()
    if (!this.isMovingAdv) {
      try {
        await foxgloveService.advertiseTopic(CMD_VEL_TOPIC_OPTION)
        this.isMovingAdv = true
      } catch (err) {
        throw new Error(`Failed to advertise topic: ${err}`)
      }
    }
    return foxgloveService.publishMessage('/cmd_vel', {
      linear: { x: linearSpeed, y: 0.0, z: 0.0 },
      angular: { x: 0.0, y: 0.0, z: angularSpeed },
    })
  }

}
