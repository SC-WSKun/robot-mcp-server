import { FastMCP } from "fastmcp";
import { z } from "zod";
import * as services from "./services/index.js";
import { RobotService } from "./services/robot.service.js";

/**
 * Register all tools with the MCP server
 *
 * @param server The FastMCP server instance
 */
export function registerTools(server: FastMCP) {
  // Greeting tool
  server.addTool({
    name: "robot-move",
    description: "make robot move with the certain linear speed and angular speed",
    parameters: z.object({
      linear: z.number().describe("linear speed"),
      angular: z.number().describe("angular speed")
    }),
    execute: async (param) => {
      await RobotService.moving(param.linear, param.angular)
      return '正在移动中'
    }
  });
}