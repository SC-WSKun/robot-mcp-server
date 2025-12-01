import { FoxgloveService } from "./foxglove.js";

const SWITCH_MODE_SERVICE = "/tiered_nav_state_machine/switch_mode";
const GET_LABELS_SERVICE = "/nav2_extended/get_labels";
const NAVIGATE_TARGET_LABEL_SERVICE = "/nav2_extended/label_goal_pose";
const LOAD_MAP_SERVICE = "/tiered_nav_state_machine/load_map"

/**
 * A simple service for controlling robot navigation to target
 * And it depends on the foxglove client init by the foxglove service
 * If you want to navigation, you can use getLocationNames first to get the targets,
 * and then use navigateToLocation to drive robot start navigation
 */
export class NavigationClass {
  private static goalSeq: number = 0;
  static isNavActive: boolean = false;

  /**
   * enable navigation mode
   */
  public static async enableNavigation() {
    const foxgloveService = FoxgloveService.getInstance();
    // mode: 2 is navigation mode
    await foxgloveService.callService(SWITCH_MODE_SERVICE, { mode: 2 });
    NavigationClass.isNavActive = true;
  }

  /**
   * disable navigation mode
   */
  public static async disableNavigation() {
    const foxgloveService = FoxgloveService.getInstance();
    // mode: 0 is idle mode
    await foxgloveService.callService(SWITCH_MODE_SERVICE, { mode: 0 });
    NavigationClass.isNavActive = false;
  }

  /**
   * get location names the robot can reach
   * @returns location names
   */
  public static async getLocationNames() {
    if (!NavigationClass.isNavActive) {
      await NavigationClass.enableNavigation();
    }
    const foxgloveService = FoxgloveService.getInstance();
    return foxgloveService.callService(GET_LABELS_SERVICE, {});
  }

  /**
   * make robot go to target location
   * @param locationName target location's name
   * @returns action result
   */
  public static async navigateToLocation(locationName: string) {
    if (!NavigationClass.isNavActive) {
      await NavigationClass.enableNavigation();
    }
    const foxgloveService = FoxgloveService.getInstance();
    // Foxglove not support GBK. You shold transform it to UTF-8 before publish message
    locationName = new TextEncoder().encode(locationName).toString();
    return foxgloveService.callService(NAVIGATE_TARGET_LABEL_SERVICE, {
      header: {
        seq: this.goalSeq++,
        stamp: {
          secs: Math.floor(Date.now() / 1000),
          nsecs: (Date.now() / 1000) * 1000000,
        },
        frame_id: "map",
      },
      label_name: locationName,
    });
  }
}
