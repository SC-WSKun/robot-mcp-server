import { CMD_VEL_TOPIC_OPTION } from '../../const/topic.option.js'
import { FoxgloveService } from './index.js'

/**
 * A simple service for controlling robot moving
 * It contains moving / navigation / position marker and other functions
 * And it depends on the foxglove client init by the foxglove service
 */
export class RobotService {
  private static isMovingAdv: boolean = false
  private static goalSeq: number = 0
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

  /**
   * get location names the robot can reach
   * @returns location names
   */
  public static async getLocationNames() {
    const foxgloveService = FoxgloveService.getInstance()
    return foxgloveService.callService('/nav2_extended/get_labels', {})
  }

  /**
   * make robot go to target location
   * @param locationName target location's name
   * @returns action result
   */
  public static async navigateToLocation(locationName: string) {
    const foxgloveService = FoxgloveService.getInstance()
    // Foxglove not support GBK. You shold transform it to UTF-8 before publish message
    locationName = new TextEncoder().encode(locationName).toString()
    return foxgloveService.callService('/nav2_extended/label_goal_pose', {
      header: {
        seq: this.goalSeq++,
        stamp: {
          secs: Math.floor(Date.now() / 1000),
          nsecs: (Date.now() / 1000) * 1000000,
        },
        frame_id: 'map',
      },
      label_name: locationName,
    })
  }
}
