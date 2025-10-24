import { query } from '@anthropic-ai/claude-agent-sdk';
import { purchasingAgents } from './agents';
import { purchasingToolsServer } from './tools';

/**
 * Example: Using the Purchasing Agent Group
 *
 * This demonstrates how to use specialized purchasing agents to handle
 * a complete procurement workflow with multiple steps.
 */

async function main() {
  console.log('🛒 Purchasing Agent Group - Demo\n');
  console.log('=' .repeat(60));

  // Example 1: Vendor Research Task
  console.log('\n📊 Example 1: Vendor Research for Electronics Components\n');

  const vendorResearchQuery = query({
    prompt: `I need to find vendors for purchasing 500 units of industrial microcontrollers
    with the following requirements:
    - ARM Cortex-M4 processor
    - Operating temperature: -40°C to +85°C
    - ISO 9001 certified
    - Prefer vendors in USA or Europe

    Please search for qualified vendors and evaluate the top 3 candidates.`,
    options: {
      agents: purchasingAgents,
      mcpServers: {
        'purchasing-tools': purchasingToolsServer,
      },
      // Use the vendor research agent for this task
      customSystemPrompt: purchasingAgents['vendor-research'].prompt,
      allowedTools: [
        'search_vendors',
        'evaluate_vendor',
        'WebSearch',
        'TodoWrite',
      ],
    },
  });

  console.log('Running vendor research agent...\n');
  for await (const message of vendorResearchQuery) {
    if (message.type === 'assistant') {
      console.log('Agent:', message.message.content);
    } else if (message.type === 'result') {
      console.log('\n✅ Vendor research completed');
      console.log(`Turns: ${message.num_turns}, Cost: $${message.total_cost_usd.toFixed(4)}`);
    }
  }

  // Example 2: Price Negotiation Task
  console.log('\n\n💰 Example 2: Price Analysis and Negotiation Strategy\n');

  const priceNegotiationQuery = query({
    prompt: `Based on the vendors found, I need to:
    1. Compare prices from TechSupply Corp, Global Parts Ltd, and Premium Components Inc
    2. Calculate the Total Cost of Ownership for a 5-year period
    3. Develop a negotiation strategy

    Product: Industrial Microcontroller ARM-M4
    Quantity: 500 units
    Assume annual maintenance cost: $5 per unit
    Expected lifetime: 5 years`,
    options: {
      agents: purchasingAgents,
      mcpServers: {
        'purchasing-tools': purchasingToolsServer,
      },
      customSystemPrompt: purchasingAgents['price-negotiation'].prompt,
      allowedTools: ['compare_prices', 'calculate_tco', 'TodoWrite'],
    },
  });

  console.log('Running price negotiation agent...\n');
  for await (const message of priceNegotiationQuery) {
    if (message.type === 'assistant') {
      console.log('Agent:', message.message.content);
    } else if (message.type === 'result') {
      console.log('\n✅ Price analysis completed');
      console.log(`Turns: ${message.num_turns}, Cost: $${message.total_cost_usd.toFixed(4)}`);
    }
  }

  // Example 3: Full Procurement Coordination
  console.log('\n\n🎯 Example 3: Complete Procurement Process Coordination\n');

  const coordinatorQuery = query({
    prompt: `I need to purchase 500 industrial microcontrollers. Please coordinate the complete
    procurement process:

    1. Search and evaluate vendors
    2. Compare prices and calculate TCO
    3. Generate an RFQ for the top 2 vendors
    4. Recommend the best vendor based on all factors
    5. Generate a purchase order for the selected vendor

    Requirements:
    - Product: Industrial Microcontroller ARM Cortex-M4
    - Quantity: 500 units
    - Required delivery: 60 days from order
    - Budget: ~$30,000
    - Must be ISO 9001 certified

    Use the TodoWrite tool to track all procurement tasks.`,
    options: {
      agents: purchasingAgents,
      mcpServers: {
        'purchasing-tools': purchasingToolsServer,
      },
      customSystemPrompt: purchasingAgents['procurement-coordinator'].prompt,
      allowedTools: [
        'search_vendors',
        'evaluate_vendor',
        'compare_prices',
        'calculate_tco',
        'generate_rfq',
        'generate_purchase_order',
        'TodoWrite',
      ],
      maxTurns: 20, // Allow more turns for complex coordination
    },
  });

  console.log('Running procurement coordinator agent...\n');
  for await (const message of coordinatorQuery) {
    if (message.type === 'assistant') {
      console.log('Agent:', message.message.content);
    } else if (message.type === 'result') {
      console.log('\n✅ Procurement coordination completed');
      console.log(`Turns: ${message.num_turns}, Cost: $${message.total_cost_usd.toFixed(4)}`);
      console.log(`Permission denials: ${message.permission_denials.length}`);
    }
  }

  // Example 4: Multi-Agent Collaboration (Sequential)
  console.log('\n\n🤝 Example 4: Multi-Agent Collaboration\n');
  console.log('Demonstrating how to use multiple agents in sequence...\n');

  // Step 1: Compliance check
  const complianceQuery = query({
    prompt: `Evaluate Premium Components Inc for compliance and risk assessment.
    Focus on: certifications, quality standards, financial stability, and supply chain risks.`,
    options: {
      agents: purchasingAgents,
      mcpServers: {
        'purchasing-tools': purchasingToolsServer,
      },
      customSystemPrompt: purchasingAgents['compliance'].prompt,
      allowedTools: ['evaluate_vendor', 'WebSearch'],
    },
  });

  console.log('Step 1: Compliance check...\n');
  for await (const message of complianceQuery) {
    if (message.type === 'assistant') {
      console.log('Compliance Agent:', message.message.content);
    } else if (message.type === 'result') {
      console.log('\n✅ Compliance check completed\n');
    }
  }

  // Step 2: Supply chain analysis
  const supplyChainQuery = query({
    prompt: `Analyze the supply chain implications of ordering 500 microcontrollers from Premium Components Inc.
    Consider lead times, delivery reliability, and recommend optimal order strategy.`,
    options: {
      agents: purchasingAgents,
      mcpServers: {
        'purchasing-tools': purchasingToolsServer,
      },
      customSystemPrompt: purchasingAgents['supply-chain'].prompt,
      allowedTools: ['compare_prices', 'calculate_tco'],
    },
  });

  console.log('Step 2: Supply chain analysis...\n');
  for await (const message of supplyChainQuery) {
    if (message.type === 'assistant') {
      console.log('Supply Chain Agent:', message.message.content);
    } else if (message.type === 'result') {
      console.log('\n✅ Supply chain analysis completed');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ All examples completed successfully!\n');
}

// Run the examples
if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { main };
