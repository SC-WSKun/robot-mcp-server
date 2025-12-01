import { FoxgloveService } from "./foxglove.js";
import { NavigationClass } from "./navigation.js";

const POSE_TOPIC = "/nav2_extended/navigate_through_poses_topic";
const GET_PATROL_ROUTES_SERVICE = "/nav2_extended/get_patrol_tasks";
const START_PATROL_SERVICE = "/nav2_extended/start_patrol";
const STOP_PATROL_SERVICE = "/nav2_extended/stop_patrol";

function patrolLog(...args: any) {
  console.log(`[PatrolService] `, ...args);
}

export class PatrolService {
  private static channelId: number = -1; // foxglove channel id
  private static patrolling = false; // if robot patrolling now
  /**
   * get patrol routes
   */
  static async getPatrolRoutes() {
    patrolLog(`get patrol routes`);
    if (!NavigationClass.isNavActive) {
      await NavigationClass.enableNavigation();
    }
    const foxgloveClient = FoxgloveService.getInstance();
    const { result, tasks } = await foxgloveClient.callService(
      GET_PATROL_ROUTES_SERVICE,
      {}
    );
    if (!result) return Promise.reject(`get patrol routes failed:${result}`);
    return tasks;
  }

  /**
   * process the response data from patrol channel
   * @param timestamp
   * @param data
   */
  static patrolMsgHandler(timestamp: bigint, data: any) {
    // TODO: process the response data if you need
    return;
  }

  /**
   * start patrol mode
   */
  private static subscribePatrolTopic() {
    patrolLog(`subscribe patrol topic`);
    const foxgloveClient = FoxgloveService.getInstance();
    // check if channel already exist
    if (foxgloveClient.checkChannelStatus(POSE_TOPIC) !== -1) return;
    foxgloveClient.subscribeTopic(POSE_TOPIC).then((res) => {
      PatrolService.channelId = res;
      foxgloveClient.addHandler(POSE_TOPIC, this.patrolMsgHandler);
    });
  }

  /**
   * start patrol with route
   * @param patrolInf task name: route name
   *                  loop count: 0 means infinite loop (todo)
   */
  static async startPatrol(patrolInf: {
    task_name: string;
    loop_count: number;
  }) {
    patrolLog(`start patrol with route:${patrolInf.task_name}`);
    if (!NavigationClass.isNavActive) {
      await NavigationClass.enableNavigation();
    }
    PatrolService.patrolling = true;
    const foxgloveClient = FoxgloveService.getInstance();
    const { result } = await foxgloveClient.callService(
      START_PATROL_SERVICE,
      patrolInf
    );
    return result;
  }

  /**
   * stop patrol

   */
  static async stopPatrol() {
    patrolLog(`stop patrol`);
    const foxgloveClient = FoxgloveService.getInstance();
    const { result } = await foxgloveClient.callService(
      STOP_PATROL_SERVICE,
      {}
    );
    PatrolService.patrolling = false;
    return result;
  }
}
