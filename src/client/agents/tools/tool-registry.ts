import {Tool} from "./tool";

export class ToolRegistry {
    private tools: Record<string, Tool> = {};

    registerTools(tools: Tool[]): void {
        tools.forEach((tool) => {
            this.tools[tool.name] = tool;
            console.log(`Registered tool: ${tool.name}`);
        });
    }

    async callTool(toolName: string, ...args: any[]): Promise<any> {
        const tool = this.tools[toolName];
        if (tool) {
            console.log(`Calling tool: ${tool.name}`);
            return await tool.execute(...args);
        } else {
            throw new Error(`Tool '${toolName}' not found.`);
        }
    }

    getToolInfo(toolName: string): { name: string; description: string, queryFormat: any } {
        const tool = this.tools[toolName];
        if (!tool) {
            throw new Error(`Tool '${toolName}' not found.`);
        }
        return { name: tool.name, description: tool.description, queryFormat: tool.getQueryFormat() };
    }

    getAllTools(): Record<string, { name: string; description: string; queryFormat: any }> {
        const toolInfos: Record<string, { name: string; description: string; queryFormat: any }> = {};
        for (const toolName in this.tools) {
            const tool = this.tools[toolName];
            toolInfos[toolName] = {
                name: tool.name,
                description: tool.description,
                queryFormat: tool.getQueryFormat(),
            };
        }
        return toolInfos;
    }

}