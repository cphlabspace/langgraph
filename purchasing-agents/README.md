# Purchasing Agent Group

A comprehensive AI-powered procurement system built with the Claude Agent SDK. This system includes specialized agents and custom tools for handling complex purchasing workflows.

## Overview

This purchasing agent group consists of **5 specialized AI agents** and **6 custom tools** designed to automate and optimize procurement processes.

### Specialized Agents

1. **Vendor Research Agent** (`vendor-research`)
   - Finds and evaluates potential suppliers
   - Assesses vendor capabilities and certifications
   - Provides risk assessments and recommendations
   - **Tools**: search_vendors, evaluate_vendor, WebSearch, WebFetch

2. **Price Negotiation Agent** (`price-negotiation`)
   - Analyzes and compares prices across vendors
   - Calculates Total Cost of Ownership (TCO)
   - Develops negotiation strategies
   - **Tools**: compare_prices, calculate_tco, generate_rfq

3. **Procurement Coordinator Agent** (`procurement-coordinator`)
   - Orchestrates the complete procurement workflow
   - Coordinates between stakeholders
   - Manages documentation and compliance
   - **Tools**: All purchasing tools + TodoWrite

4. **Compliance & Risk Agent** (`compliance`)
   - Verifies regulatory compliance
   - Conducts risk assessments
   - Reviews contract terms
   - **Tools**: evaluate_vendor, WebSearch

5. **Supply Chain Analyst Agent** (`supply-chain`)
   - Optimizes logistics and delivery
   - Analyzes lead times and inventory
   - Manages supply chain risks
   - **Tools**: search_vendors, compare_prices, calculate_tco

### Custom Tools (Skills)

All tools are implemented as MCP (Model Context Protocol) tools:

1. **search_vendors** - Search for potential vendors based on criteria
2. **compare_prices** - Compare prices and terms across multiple vendors
3. **evaluate_vendor** - Detailed vendor evaluation and risk assessment
4. **generate_rfq** - Generate professional Request for Quote documents
5. **calculate_tco** - Calculate Total Cost of Ownership
6. **generate_purchase_order** - Generate formal purchase orders

## Project Structure

```
purchasing-agents/
├── README.md           # This file
├── agents.ts           # Agent definitions and configurations
├── tools.ts            # Custom tool implementations
├── main.ts             # Example usage and demonstrations
└── package.json        # Dependencies (if needed separately)
```

## Installation

Make sure you have the Claude Agent SDK installed:

```bash
npm install @anthropic-ai/claude-agent-sdk
```

Additional dependencies:
```bash
npm install zod
```

## Usage

### Basic Example - Single Agent

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';
import { purchasingAgents } from './agents';
import { purchasingToolsServer } from './tools';

// Use the vendor research agent
const result = query({
  prompt: 'Find vendors for industrial sensors in Germany',
  options: {
    agents: purchasingAgents,
    mcpServers: {
      'purchasing-tools': purchasingToolsServer,
    },
    customSystemPrompt: purchasingAgents['vendor-research'].prompt,
    allowedTools: ['search_vendors', 'evaluate_vendor'],
  },
});

for await (const message of result) {
  if (message.type === 'assistant') {
    console.log(message.message.content);
  }
}
```

### Advanced Example - Multi-Agent Workflow

```typescript
// Step 1: Research vendors
const vendorResearch = await runAgent('vendor-research',
  'Find top 3 vendors for microcontrollers');

// Step 2: Analyze prices
const priceAnalysis = await runAgent('price-negotiation',
  'Compare prices and calculate TCO for the top 3 vendors');

// Step 3: Compliance check
const compliance = await runAgent('compliance',
  'Verify compliance and assess risks for the selected vendor');

// Step 4: Generate purchase order
const purchaseOrder = await runAgent('procurement-coordinator',
  'Generate purchase order for the approved vendor');
```

### Running the Examples

The `main.ts` file includes comprehensive examples:

```bash
# Run with ts-node
npx ts-node purchasing-agents/main.ts

# Or compile and run
npx tsc purchasing-agents/main.ts
node purchasing-agents/main.js
```

## Example Workflows

### 1. Simple Vendor Search
```typescript
const query = query({
  prompt: 'Find ISO 9001 certified electronics vendors in USA',
  options: {
    agents: purchasingAgents,
    mcpServers: { 'purchasing-tools': purchasingToolsServer },
    customSystemPrompt: purchasingAgents['vendor-research'].prompt,
  },
});
```

### 2. Complete Procurement Process
```typescript
const query = query({
  prompt: `Execute complete procurement for:
  - Product: 1000 sensors
  - Budget: $50,000
  - Delivery: 30 days

  Include vendor research, price comparison, TCO analysis, and PO generation.`,
  options: {
    agents: purchasingAgents,
    mcpServers: { 'purchasing-tools': purchasingToolsServer },
    customSystemPrompt: purchasingAgents['procurement-coordinator'].prompt,
    maxTurns: 20,
  },
});
```

### 3. Price Negotiation Strategy
```typescript
const query = query({
  prompt: 'Compare prices from 3 vendors and develop negotiation strategy for 500 units',
  options: {
    agents: purchasingAgents,
    mcpServers: { 'purchasing-tools': purchasingToolsServer },
    customSystemPrompt: purchasingAgents['price-negotiation'].prompt,
  },
});
```

## Key Features

- **Modular Design**: Each agent has specific expertise and tools
- **Reusable Tools**: Custom MCP tools can be used across agents
- **Flexible Orchestration**: Use agents individually or in workflows
- **Real-world Simulations**: Tools include realistic business logic
- **Comprehensive Coverage**: Handles full procurement lifecycle
- **Type Safety**: Built with TypeScript for robust development

## Customization

### Adding New Tools

Add new tools in `tools.ts`:

```typescript
const myCustomTool = tool(
  'my_tool_name',
  'Tool description',
  {
    param1: z.string().describe('Parameter description'),
  },
  async (args) => {
    // Tool implementation
    return {
      content: [{ type: 'text', text: 'Result' }],
    };
  }
);

// Add to purchasingToolsServer
export const purchasingToolsServer = createSdkMcpServer({
  name: 'purchasing-tools',
  version: '1.0.0',
  tools: [
    // ... existing tools
    myCustomTool,
  ],
});
```

### Creating New Agents

Add new agent definitions in `agents.ts`:

```typescript
export const myCustomAgent: AgentDefinition = {
  description: 'Expert in specific domain',
  model: 'sonnet',
  tools: ['tool1', 'tool2'],
  prompt: `You are an expert in...`,
};
```

### Modifying Agent Behavior

Customize agent prompts to change their behavior, expertise, and approach to tasks.

## Best Practices

1. **Agent Selection**: Choose the right agent for specific tasks
2. **Tool Access**: Grant agents only the tools they need
3. **Error Handling**: Implement proper error handling in production
4. **Cost Management**: Set `maxTurns` to control costs
5. **Logging**: Add comprehensive logging for production use
6. **Testing**: Test agents with various scenarios
7. **Security**: Validate and sanitize all inputs in production

## Production Considerations

For production use, enhance the tools with:

- Real database connections for vendor data
- Integration with ERP/procurement systems
- Actual pricing APIs and market data
- Document generation and storage
- Approval workflows and audit trails
- Email notifications and alerts
- User authentication and authorization
- Comprehensive error handling and logging

## Dependencies

- `@anthropic-ai/claude-agent-sdk` - Claude Agent SDK
- `zod` - Schema validation for tool inputs
- `@modelcontextprotocol/sdk` - MCP protocol support

## License

This is example code for demonstration purposes.

## Support

For issues with the Claude Agent SDK:
- Documentation: https://docs.claude.com/en/api/agent-sdk/overview
- GitHub: https://github.com/anthropics/claude-agent-sdk-typescript/issues

## Examples in main.ts

The `main.ts` file includes 4 comprehensive examples:

1. **Vendor Research** - Finding and evaluating vendors
2. **Price Analysis** - Comparing prices and calculating TCO
3. **Full Procurement** - Complete end-to-end workflow
4. **Multi-Agent Collaboration** - Sequential agent coordination

Run the examples to see the agents in action!
