import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

/**
 * Custom tools (skills) for purchasing agents
 * These tools provide specialized capabilities for procurement tasks
 */

// Tool: Search for vendors
const searchVendors = tool(
  'search_vendors',
  'Search for potential vendors based on product category and requirements',
  {
    product_category: z.string().describe('The category of product or service needed'),
    requirements: z.string().describe('Specific requirements or criteria for vendors'),
    location: z.string().optional().describe('Preferred vendor location'),
  },
  async (args) => {
    // Simulated vendor search - in production, this would query real databases
    const mockVendors = [
      {
        name: 'TechSupply Corp',
        rating: 4.5,
        category: 'electronics',
        location: 'USA',
        certifications: ['ISO 9001', 'RoHS'],
      },
      {
        name: 'Global Parts Ltd',
        rating: 4.2,
        category: 'electronics',
        location: 'China',
        certifications: ['ISO 9001'],
      },
      {
        name: 'Premium Components Inc',
        rating: 4.8,
        category: 'electronics',
        location: 'Germany',
        certifications: ['ISO 9001', 'CE', 'RoHS'],
      },
    ];

    const results = mockVendors.filter((v) =>
      v.category.toLowerCase().includes(args.product_category.toLowerCase())
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              query: args,
              vendors: results,
              total_found: results.length,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Compare prices across vendors
const comparePrices = tool(
  'compare_prices',
  'Compare prices and terms from multiple vendors for a specific product',
  {
    product_name: z.string().describe('Name of the product'),
    vendor_names: z.array(z.string()).describe('List of vendor names to compare'),
    quantity: z.number().describe('Quantity to purchase'),
  },
  async (args) => {
    // Simulated price comparison
    const priceData = args.vendor_names.map((vendor, idx) => ({
      vendor,
      unit_price: 50 + idx * 10 + Math.random() * 20,
      total_price: (50 + idx * 10 + Math.random() * 20) * args.quantity,
      lead_time_days: 7 + idx * 3,
      minimum_order: 100,
      payment_terms: '30 days net',
      shipping_cost: 50 + idx * 25,
    }));

    const sorted = priceData.sort((a, b) => a.total_price - b.total_price);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              product: args.product_name,
              quantity: args.quantity,
              comparison: sorted,
              best_price: sorted[0],
              savings_vs_highest: sorted[sorted.length - 1].total_price - sorted[0].total_price,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool: Evaluate vendor quality and reliability
const evaluateVendor = tool(
  'evaluate_vendor',
  'Perform detailed evaluation of a vendor including quality, reliability, and risk assessment',
  {
    vendor_name: z.string().describe('Name of the vendor to evaluate'),
    evaluation_criteria: z
      .array(z.string())
      .describe('Criteria to evaluate (quality, delivery, financial, compliance)'),
  },
  async (args) => {
    // Simulated vendor evaluation
    const evaluation = {
      vendor: args.vendor_name,
      overall_score: 85,
      criteria_scores: {
        quality_score: 90,
        delivery_reliability: 85,
        financial_stability: 80,
        compliance_rating: 95,
        customer_service: 85,
      },
      risk_assessment: 'Low',
      certifications: ['ISO 9001:2015', 'ISO 14001', 'OHSAS 18001'],
      years_in_business: 15,
      previous_performance: {
        on_time_delivery: '92%',
        quality_acceptance_rate: '98%',
        average_response_time: '4 hours',
      },
      recommendations: [
        'Strong vendor with excellent quality track record',
        'Consider for strategic partnership',
        'Request updated financial statements annually',
      ],
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(evaluation, null, 2),
        },
      ],
    };
  }
);

// Tool: Generate Request for Quote (RFQ)
const generateRFQ = tool(
  'generate_rfq',
  'Generate a professional Request for Quote document',
  {
    product_description: z.string().describe('Description of the product or service needed'),
    quantity: z.number().describe('Quantity required'),
    specifications: z.string().describe('Technical specifications and requirements'),
    delivery_date: z.string().describe('Required delivery date'),
  },
  async (args) => {
    const rfqDocument = `
REQUEST FOR QUOTE (RFQ)
========================

RFQ Number: RFQ-${Date.now()}
Date Issued: ${new Date().toLocaleDateString()}

1. PRODUCT/SERVICE INFORMATION
   Description: ${args.product_description}
   Quantity: ${args.quantity} units
   Required Delivery Date: ${args.delivery_date}

2. TECHNICAL SPECIFICATIONS
${args.specifications}

3. QUOTE REQUIREMENTS
   Please provide the following information:
   - Unit price and total price
   - Lead time for production and delivery
   - Payment terms
   - Warranty information
   - Shipping and handling costs
   - Validity period of the quote

4. SUBMISSION DEADLINE
   Please submit your quote by: ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}

5. TERMS AND CONDITIONS
   - Quotes must be submitted in USD
   - All prices should be FOB destination
   - Standard warranty terms required
   - Vendor must maintain required certifications

Please submit your quote to: procurement@company.com
`;

    return {
      content: [
        {
          type: 'text',
          text: rfqDocument,
        },
      ],
    };
  }
);

// Tool: Calculate Total Cost of Ownership (TCO)
const calculateTCO = tool(
  'calculate_tco',
  'Calculate the Total Cost of Ownership including all direct and indirect costs',
  {
    purchase_price: z.number().describe('Initial purchase price'),
    quantity: z.number().describe('Quantity to purchase'),
    annual_maintenance_cost: z.number().describe('Annual maintenance cost per unit'),
    expected_lifetime_years: z.number().describe('Expected lifetime in years'),
    shipping_cost: z.number().optional().describe('Shipping cost'),
    training_cost: z.number().optional().describe('Training cost'),
  },
  async (args) => {
    const initialCost = args.purchase_price * args.quantity;
    const shippingCost = args.shipping_cost || 0;
    const trainingCost = args.training_cost || 0;
    const maintenanceCost = args.annual_maintenance_cost * args.quantity * args.expected_lifetime_years;
    const totalCost = initialCost + shippingCost + trainingCost + maintenanceCost;

    const tcoAnalysis = {
      breakdown: {
        initial_purchase: initialCost,
        shipping: shippingCost,
        training: trainingCost,
        maintenance_over_lifetime: maintenanceCost,
        total_cost_of_ownership: totalCost,
      },
      per_unit_tco: totalCost / args.quantity,
      annual_tco: totalCost / args.expected_lifetime_years,
      cost_components_percentage: {
        initial_purchase: ((initialCost / totalCost) * 100).toFixed(2) + '%',
        maintenance: ((maintenanceCost / totalCost) * 100).toFixed(2) + '%',
        other: (((shippingCost + trainingCost) / totalCost) * 100).toFixed(2) + '%',
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(tcoAnalysis, null, 2),
        },
      ],
    };
  }
);

// Tool: Generate purchase order
const generatePurchaseOrder = tool(
  'generate_purchase_order',
  'Generate a formal purchase order document',
  {
    vendor_name: z.string().describe('Vendor name'),
    product_name: z.string().describe('Product name'),
    quantity: z.number().describe('Quantity to order'),
    unit_price: z.number().describe('Unit price'),
    delivery_date: z.string().describe('Expected delivery date'),
    payment_terms: z.string().describe('Payment terms'),
  },
  async (args) => {
    const totalAmount = args.quantity * args.unit_price;
    const poDocument = `
PURCHASE ORDER
==============

PO Number: PO-${Date.now()}
Date: ${new Date().toLocaleDateString()}

VENDOR INFORMATION:
Vendor: ${args.vendor_name}

ORDER DETAILS:
Product: ${args.product_name}
Quantity: ${args.quantity} units
Unit Price: $${args.unit_price.toFixed(2)}
Total Amount: $${totalAmount.toFixed(2)}

DELIVERY INFORMATION:
Expected Delivery Date: ${args.delivery_date}

PAYMENT TERMS:
${args.payment_terms}

AUTHORIZED BY: Procurement Department
Date: ${new Date().toLocaleDateString()}

Please confirm receipt and acceptance of this purchase order within 2 business days.
`;

    return {
      content: [
        {
          type: 'text',
          text: poDocument,
        },
      ],
    };
  }
);

// Create MCP server with all purchasing tools
export const purchasingToolsServer = createSdkMcpServer({
  name: 'purchasing-tools',
  version: '1.0.0',
  tools: [
    searchVendors,
    comparePrices,
    evaluateVendor,
    generateRFQ,
    calculateTCO,
    generatePurchaseOrder,
  ],
});
