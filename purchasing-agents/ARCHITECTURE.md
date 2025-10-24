# Purchasing Agent Group - Architecture

## System Overview

The Purchasing Agent Group is a multi-agent AI system built on the Claude Agent SDK that automates and optimizes procurement workflows. The system uses specialized agents, each with specific expertise and tools, working together to handle complex purchasing scenarios.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Purchasing Agent System                      │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │
        ┌────────────────────────┴────────────────────────┐
        │                                                   │
        ▼                                                   ▼
┌──────────────────┐                           ┌─────────────────────┐
│  Agent Layer     │                           │  Tools Layer (MCP)  │
│                  │                           │                     │
│  5 Specialized   │◄──────────────────────────│  6 Custom Tools     │
│  Agents          │      Uses Tools           │                     │
└──────────────────┘                           └─────────────────────┘
```

## Component Breakdown

### 1. Agent Layer

Five specialized agents, each with domain expertise:

```
┌─────────────────────────────────────────────────────────────────┐
│                        AGENT LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐      ┌──────────────────────┐        │
│  │ Vendor Research      │      │ Price Negotiation    │        │
│  │ Agent                │      │ Agent                │        │
│  ├──────────────────────┤      ├──────────────────────┤        │
│  │ • Find vendors       │      │ • Compare prices     │        │
│  │ • Evaluate quality   │      │ • Calculate TCO      │        │
│  │ • Risk assessment    │      │ • Negotiation plan   │        │
│  └──────────────────────┘      └──────────────────────┘        │
│                                                                  │
│  ┌──────────────────────┐      ┌──────────────────────┐        │
│  │ Procurement          │      │ Compliance & Risk    │        │
│  │ Coordinator          │      │ Agent                │        │
│  ├──────────────────────┤      ├──────────────────────┤        │
│  │ • Orchestrate flow   │      │ • Verify compliance  │        │
│  │ • Manage docs        │      │ • Assess risks       │        │
│  │ • Stakeholder coord  │      │ • Contract review    │        │
│  └──────────────────────┘      └──────────────────────┘        │
│                                                                  │
│  ┌──────────────────────┐                                       │
│  │ Supply Chain         │                                       │
│  │ Analyst              │                                       │
│  ├──────────────────────┤                                       │
│  │ • Optimize logistics │                                       │
│  │ • Lead time analysis │                                       │
│  │ • Inventory planning │                                       │
│  └──────────────────────┘                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Tools Layer (MCP)

Six custom tools implemented using the Model Context Protocol:

```
┌─────────────────────────────────────────────────────────────────┐
│                        TOOLS LAYER (MCP)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  search_vendors              compare_prices                     │
│  ├─ Search by category      ├─ Multi-vendor comparison          │
│  ├─ Filter by location      ├─ Total price calculation          │
│  └─ Certification check     └─ Lead time comparison             │
│                                                                  │
│  evaluate_vendor             calculate_tco                      │
│  ├─ Quality scoring          ├─ Initial cost                    │
│  ├─ Risk assessment          ├─ Maintenance cost                │
│  └─ Compliance check         └─ Lifetime analysis               │
│                                                                  │
│  generate_rfq                generate_purchase_order            │
│  ├─ RFQ document             ├─ PO document                     │
│  ├─ Specifications           ├─ Vendor details                  │
│  └─ Terms & conditions       └─ Payment terms                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Single Agent Workflow

```
User Request
     │
     ▼
┌─────────────────┐
│ Select Agent    │
│ (based on task) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Agent Processes │
│ Request         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Use Tools       │
│ (MCP calls)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate        │
│ Response        │
└────────┬────────┘
         │
         ▼
    Result to User
```

### Multi-Agent Workflow

```
User Request (Complex Procurement)
         │
         ▼
┌──────────────────────┐
│ Procurement          │
│ Coordinator Agent    │
└─────────┬────────────┘
          │
          ├─────────────────────────┐
          │                         │
          ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│ Vendor Research  │      │ Compliance Agent │
│ Agent            │      │                  │
└─────────┬────────┘      └─────────┬────────┘
          │                         │
          │ Results                 │ Results
          ├─────────────┬───────────┘
          │             │
          ▼             ▼
┌──────────────────────────┐
│ Price Negotiation Agent  │
└─────────┬────────────────┘
          │
          │ Results
          ▼
┌──────────────────────┐
│ Supply Chain Agent   │
└─────────┬────────────┘
          │
          ▼
    Final Recommendation
```

## Agent-Tool Matrix

| Agent                    | Tools Available                                    |
|--------------------------|---------------------------------------------------|
| Vendor Research          | search_vendors, evaluate_vendor, WebSearch        |
| Price Negotiation        | compare_prices, calculate_tco, generate_rfq       |
| Procurement Coordinator  | All tools + TodoWrite                             |
| Compliance & Risk        | evaluate_vendor, WebSearch                        |
| Supply Chain Analyst     | search_vendors, compare_prices, calculate_tco     |

## Usage Patterns

### Pattern 1: Simple Task (Single Agent)

```typescript
// Direct agent invocation for a specific task
query({
  prompt: "Find vendors for laptops",
  options: {
    agents: purchasingAgents,
    customSystemPrompt: purchasingAgents['vendor-research'].prompt,
  }
})
```

### Pattern 2: Complex Workflow (Sequential Agents)

```typescript
// Step 1: Research
const vendors = await runAgent('vendor-research', '...');

// Step 2: Analyze (using results from step 1)
const analysis = await runAgent('price-negotiation', '...');

// Step 3: Verify (using results from step 2)
const compliance = await runAgent('compliance', '...');

// Step 4: Execute (final decision)
const po = await runAgent('procurement-coordinator', '...');
```

### Pattern 3: Coordinator-Driven (Orchestration)

```typescript
// Let coordinator agent manage the entire workflow
query({
  prompt: "Complete procurement for 500 sensors",
  options: {
    agents: purchasingAgents,
    customSystemPrompt: purchasingAgents['procurement-coordinator'].prompt,
    maxTurns: 20, // Allow complex multi-step process
  }
})
```

## Key Design Principles

### 1. Separation of Concerns
- Each agent has a specific domain of expertise
- Tools are modular and reusable
- Clear boundaries between agent responsibilities

### 2. Composability
- Agents can be used independently
- Tools can be mixed and matched
- Workflows can be simple or complex

### 3. Extensibility
- Easy to add new agents
- Simple to create new tools
- Flexible prompt engineering

### 4. Real-world Simulation
- Tools include realistic business logic
- Agents use industry best practices
- Outputs follow standard formats

## Technology Stack

```
┌─────────────────────────────────────────┐
│  Application Layer                      │
│  ├─ TypeScript                          │
│  ├─ Node.js                             │
│  └─ Custom Business Logic               │
├─────────────────────────────────────────┤
│  Agent SDK Layer                        │
│  ├─ Claude Agent SDK                    │
│  ├─ Agent Definitions                   │
│  └─ Orchestration Logic                 │
├─────────────────────────────────────────┤
│  Tools Layer                            │
│  ├─ MCP (Model Context Protocol)        │
│  ├─ Zod (Schema Validation)             │
│  └─ Custom Tool Implementations         │
├─────────────────────────────────────────┤
│  AI Layer                               │
│  ├─ Claude Sonnet 4                     │
│  ├─ Claude Opus (optional)              │
│  └─ Claude Haiku (optional)             │
└─────────────────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling
- Multiple agents can run concurrently
- Independent tool executions
- Parallel vendor evaluations

### Vertical Scaling
- Add more specialized agents
- Enhance tool capabilities
- Integrate with external systems

### Production Enhancements
```
Current (Demo)              Production
─────────────────          ────────────────
Mock data                  Real databases
Simulated API              Actual vendor APIs
Local execution            Cloud deployment
Basic logging              Full observability
Simple errors              Robust error handling
```

## Integration Points

The system can be extended with:

1. **ERP Systems** - Connect to enterprise resource planning
2. **Vendor Portals** - Direct integration with supplier systems
3. **Finance Systems** - Automated approval workflows
4. **Inventory Management** - Real-time stock updates
5. **Analytics Platforms** - Business intelligence and reporting
6. **Document Management** - Contract and PO storage
7. **Communication Systems** - Email, Slack, Teams notifications

## Security Considerations

- Input validation on all tool parameters
- Access control for sensitive operations
- Audit logging for all transactions
- Secure credential management
- Data encryption for sensitive information
- Compliance with procurement regulations

## Future Enhancements

- **Machine Learning** - Price prediction and trend analysis
- **Advanced Negotiation** - Multi-round negotiation automation
- **Supplier Scoring** - ML-based vendor rating system
- **Contract Analysis** - AI-powered contract review
- **Market Intelligence** - Real-time market data integration
- **Predictive Analytics** - Demand forecasting
- **Automated RFPs** - End-to-end RFP management

## Conclusion

The Purchasing Agent Group demonstrates a modular, scalable approach to AI-powered procurement. By combining specialized agents with purpose-built tools, the system can handle simple queries or orchestrate complex, multi-step procurement workflows.
