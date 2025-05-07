import { FastMCP } from 'fastmcp'
import { z } from 'zod'
import * as services from './services/index.js'

/**
 * Register all tools with the MCP server
 *
 * @param server The FastMCP server instance
 */
export function registerTools(server: FastMCP) {
  // Robot Moving Tool
  server.addTool({
    name: 'robot-move',
    description:
      'make robot move with the certain linear speed and angular speed',
    parameters: z.object({
      linear: z.number().describe('linear speed'),
      angular: z.number().describe('angular speed'),
    }),
    execute: async param => {
      const res = await services.RobotService.moving(
        param.linear,
        param.angular,
      )
      return JSON.stringify(res)
    },
  })

  // Get Locations Robot Can Reach Tool
  server.addTool({
    name: 'robot-get-locations',
    description: 'get locations which robot can reach for navigation',
    parameters: z.object({}),
    execute: async () => {
      const res = await services.RobotService.getLocationNames()
      return JSON.stringify(res)
    },
  })

  // Robot Navigation Tool
  server.addTool({
    name: 'robot-navigation',
    description: 'make robot navigate to the location',
    parameters: z.object({
      locationName: z.string().describe('location name'),
    }),
    execute: async param => {
      const res = await services.RobotService.navigateToLocation(
        param.locationName,
      )
      return JSON.stringify(res)
    },
  })
}
