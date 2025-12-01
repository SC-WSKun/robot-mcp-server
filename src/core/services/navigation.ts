import { FoxgloveService } from "./foxglove"

/**
 * A simple service for controlling robot navigation to target
 * And it depends on the foxglove client init by the foxglove service
 * If you want to navigation, you can use getLocationNames first to get the targets,
 * and then use navigateToLocation to drive robot start navigation
 */
export class NavigationClass {
    private static goalSeq: number = 0

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