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
      const res = await services.BaseService.moving(
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
      const res = await services.NavigationClass.getLocationNames()
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
      const res = await services.NavigationClass.navigateToLocation(
        param.locationName,
      )
      return JSON.stringify(res)
    },
  })

  // Get Routes Robot Can Use To Patrol Tool
  server.addTool({
    name: 'robot-get-patrol-routes',
    description: 'get routes which robot can use to patrol',
    parameters: z.object({}),
    execute: async () => {
      const res = await services.PatrolService.getPatrolRoutes()
      return JSON.stringify(res)
    },
  })

  // Robot Patrol Tool
  server.addTool({
    name: 'robot-patrol',
    description: 'make robot patrol',
    parameters: z.object({
      taskName: z.string().describe('route name'),
      loopCount: z.number().describe('loop count'),
    }),
    execute: async param => {
      const res = await services.PatrolService.startPatrol({
        task_name: param.taskName,
        loop_count: param.loopCount,
      })
      return JSON.stringify(res)
    }
  })
}
