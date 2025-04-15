import { FastMCP } from "fastmcp";
import { registerResources } from "../core/resources.js";
import { registerTools } from "../core/tools.js";
import { registerPrompts } from "../core/prompts.js";

// Create and start the MCP server
async function startServer() {
  try {
    // Create a new FastMCP server instance
    const server = new FastMCP({
      name: "Robot Mcp Server",
      version: "1.0.0"
    });

    // Register all resources, tools, and prompts
    // todo: 机器人api列表？
    // registerResources(server);
    registerTools(server);
    registerPrompts(server);

    // Log server information
    console.info(`MCP Server initialized`);
    console.info("Server is ready to handle requests");

    return server;
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
}

// Export the server creation function
export default startServer;