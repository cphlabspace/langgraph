import { query } from '@anthropic-ai/claude-agent-sdk';
import { purchasingAgents } from './agents';
import { purchasingToolsServer } from './tools';

/**
 * Quick Start Example
 *
 * A simple example to get started with the purchasing agent group.
 * This demonstrates a basic vendor research task.
 */

async function quickStart() {
  console.log('🚀 Purchasing Agents - Quick Start\n');

  // Simple vendor research example
  const result = query({
    prompt: `I need to purchase 100 laptop computers for our office.

    Please help me:
    1. Search for potential vendors
    2. Evaluate the top vendors
    3. Provide your recommendation

    Requirements:
    - Business-grade laptops
    - Warranty and support included
    - Prefer vendors with good reputation`,

    options: {
      // Register all agents
      agents: purchasingAgents,

      // Register the purchasing tools server
      mcpServers: {
        'purchasing-tools': purchasingToolsServer,
      },

      // Use the vendor research agent
      customSystemPrompt: purchasingAgents['vendor-research'].prompt,

      // Allow specific tools for this task
      allowedTools: [
        'search_vendors',
        'evaluate_vendor',
        'TodoWrite', // For task tracking
      ],

      // Limit turns for this simple example
      maxTurns: 10,
    },
  });

  console.log('Running vendor research agent...\n');
  console.log('-'.repeat(60) + '\n');

  for await (const message of result) {
    if (message.type === 'assistant') {
      // Print assistant responses
      for (const content of message.message.content) {
        if (content.type === 'text') {
          console.log('Agent:', content.text);
          console.log();
        } else if (content.type === 'tool_use') {
          console.log(`Using tool: ${content.name}`);
          console.log(`Input:`, JSON.stringify(content.input, null, 2));
          console.log();
        }
      }
    } else if (message.type === 'result') {
      // Print final results
      console.log('-'.repeat(60));
      console.log('\n✅ Task completed!\n');
      console.log('Statistics:');
      console.log(`  - Turns: ${message.num_turns}`);
      console.log(`  - Cost: $${message.total_cost_usd.toFixed(4)}`);
      console.log(`  - Duration: ${(message.duration_ms / 1000).toFixed(2)}s`);

      if (message.subtype === 'success') {
        console.log(`  - Result: ${message.result}`);
      }

      // Show usage per model
      console.log('\nToken Usage:');
      for (const [model, usage] of Object.entries(message.modelUsage)) {
        console.log(`  ${model}:`);
        console.log(`    Input: ${usage.inputTokens}`);
        console.log(`    Output: ${usage.outputTokens}`);
      }
    } else if (message.type === 'system' && message.subtype === 'init') {
      console.log('System initialized');
      console.log(`Model: ${message.model}`);
      console.log(`Tools: ${message.tools.join(', ')}`);
      console.log();
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Try the other agents:');
  console.log('  - vendor-research: Find and evaluate vendors');
  console.log('  - price-negotiation: Analyze prices and negotiate');
  console.log('  - procurement-coordinator: Orchestrate full procurement');
  console.log('  - compliance: Check compliance and risks');
  console.log('  - supply-chain: Optimize logistics and delivery');
  console.log('='.repeat(60) + '\n');
}

// Run the quick start example
if (require.main === module) {
  quickStart().catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

export { quickStart };
