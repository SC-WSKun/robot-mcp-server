import { FoxgloveService } from "./index.js";

const foxgloveService = FoxgloveService.getInstance();
/**
 * A simple service for controlling robot moving
 * It contains moving / navigation / position marker and other functions
 * And it depends on the foxglove client init by the foxglove service
 */
export class RobotService {
  /**
   * do robot moving
   * @param linearSpeed linear speed
   * @param angularSpeed angular speed
   * @returns action result
   */
  public static async moving(linearSpeed: number, angularSpeed: number) {
    const moveTopicConfig = {
      encoding: "cdr",
      schema:
        "# This expresses velocity in free space broken into its linear and angular parts.\n\nVector3  linear\nVector3  angular\n\n================================================================================\nMSG: geometry_msgs/Vector3\n# This represents a vector in free space.\n\n# This is semantically different than a point.\n# A vector is always anchored at the origin.\n# When a transform is applied to a vector, only the rotational component is applied.\n\nfloat64 x\nfloat64 y\nfloat64 z\n",
      schemaEncoding: "ros2msg",
      schemaName: "geometry_msgs/msg/Twist",
      topic: "/cmd_vel",
    };
    try {
      await foxgloveService.publishMessage(
        "/cmd_vel",
        {
          linear: { x: linearSpeed, y: 0.0, z: 0.0 },
          angular: { x: 0.0, y: 0.0, z: angularSpeed },
        },
        moveTopicConfig
      );
      return true;
    } catch (err) {
      console.error("moving error:", err);
      return false;
    }
  }
}
