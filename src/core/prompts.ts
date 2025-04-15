import { FastMCP } from "fastmcp";

/**
 * Register all prompts with the MCP server
 * @param server The FastMCP server instance
 */
export function registerPrompts(server: FastMCP) {
  // Example prompt
  server.addPrompt({
    name: "greeting",
    description: "A simple greeting prompt",
    arguments: [
      {
        name: "name",
        description: "Name to greet",
        required: true,
      },
    ],
    load: async ({ name }) => {
      return `你好, ${name}! 有什么我能帮你的吗?`;
    }
  });
}
