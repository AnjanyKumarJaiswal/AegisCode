export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema?: Record<string, any>;
}
