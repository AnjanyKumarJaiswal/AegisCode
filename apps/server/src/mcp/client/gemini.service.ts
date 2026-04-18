import { Injectable } from '@nestjs/common';
import { GoogleGenAI, Tool, FunctionDeclaration } from '@google/genai';
import { ToolCall, ToolDefinition } from '@aegiscode/shared';

@Injectable()
export class GeminiClient {
  private client: GoogleGenAI;
  public modelName: string = 'gemini-3-flash-preview';

  constructor() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in the Environment Variables');
    }

    this.client = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    });
  }

  private _fixSchema(schema: any): any {
    if (typeof schema !== 'object' || schema === null) {
      return schema;
    }

    const banned = ['$schema', 'additionalProperties', '$ref', 'default'];
    const fixedSchema: Record<string, any> = {};

    for (const key of Object.keys(schema)) {
      if (banned.includes(key)) continue;

      if (key === 'properties' && typeof schema[key] === 'object') {
        fixedSchema[key] = Object.fromEntries(
          Object.entries(schema[key]).map(([k, v]) => [k, this._fixSchema(v)]),
        );
      } else if (key === 'items') {
        fixedSchema[key] = this._fixSchema(schema[key]);
      } else {
        fixedSchema[key] = schema[key];
      }
    }

    return fixedSchema;
  }

  public createToolConfig(tools: ToolDefinition[]): Tool[] {
    const functionDeclarations: FunctionDeclaration[] = tools.map((tool) => {
      const inputSchema = tool.inputSchema
        ? this._fixSchema(tool.inputSchema)
        : { type: 'object', properties: {} };

      return {
        name: tool.name,
        description: tool.description,
        parameters: inputSchema,
      };
    });

    return [{ functionDeclarations }];
  }

  public async run(
    prompt: string,
    tools: ToolDefinition[],
    toolExecutor: (call: ToolCall) => Promise<any>,
  ): Promise<string> {
    const toolConfig = this.createToolConfig(tools);

    const chat = this.client.chats.create({
      model: this.modelName,
      config: { tools: toolConfig },
    });

    let response = await chat.sendMessage({ message: prompt });

    while (true) {
      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const toolCallParts = parts.filter((p) => p.functionCall);

      if (toolCallParts.length === 0) {
        return parts.find((p) => p.text)?.text ?? '';
      }

      const toolResults = await Promise.all(
        toolCallParts.map(async (part) => {
          const fn = part.functionCall!;
          const result = await toolExecutor({
            name: fn.name!,
            arguments: (fn.args as Record<string, any>) ?? {},
          });
          return {
            functionResponse: {
              name: fn.name!,
              response: { result },
            },
          };
        }),
      );

      response = await chat.sendMessage({ message: toolResults });
    }
  }
}
