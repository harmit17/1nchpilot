import { NextRequest, NextResponse } from 'next/server';

interface AIQuestionRequest {
  question: string;
  context: {
    totalValue: number;
    tokenCount: number;
    netPnL: number;
    topHoldings: Array<{ symbol: string; value: number; percentage: number }>;
    riskScore: number;
    portfolioSummary: string;
    strengths: string[];
    weaknesses: string[];
  };
  walletAddress: string;
}

// Initialize Gemini AI
let geminiClient: any = null;

function getGeminiClient() {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    } catch (error) {
      console.error('Failed to initialize Gemini client:', error);
    }
  }
  return geminiClient;
}

export async function POST(request: NextRequest) {
  try {
    const body: AIQuestionRequest = await request.json();
    const { question, context, walletAddress } = body;

    if (!question?.trim()) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Try Gemini AI first
    const gemini = getGeminiClient();
    let answer = '';

    if (gemini) {
      try {
        const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `You are an expert DeFi portfolio analyst. A user is asking about their crypto portfolio. Please provide a helpful, actionable answer based on the portfolio data provided.

PORTFOLIO CONTEXT:
- Total Value: $${context.totalValue.toLocaleString()}
- Token Count: ${context.tokenCount}
- Net P&L: $${context.netPnL.toLocaleString()}
- Risk Score: ${context.riskScore}/10
- Top Holdings: ${context.topHoldings.map(h => `${h.symbol} (${h.percentage.toFixed(1)}%)`).join(', ')}

PORTFOLIO SUMMARY: ${context.portfolioSummary}

STRENGTHS: ${context.strengths.join(', ')}
WEAKNESSES: ${context.weaknesses.join(', ')}

USER QUESTION: ${question}

Please provide a concise, actionable response (2-3 paragraphs max) that:
1. Directly addresses their question
2. References specific data from their portfolio
3. Provides practical recommendations
4. Uses a friendly, professional tone

Answer:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        answer = response.text();

        console.log('✅ Gemini AI response generated successfully');
      } catch (geminiError) {
        console.error('❌ Gemini AI error:', geminiError);
        // Fall back to OpenAI or demo response
      }
    }

    // Fallback to OpenAI if Gemini fails
    if (!answer && process.env.OPENAI_API_KEY) {
      try {
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert DeFi portfolio analyst. Provide helpful, actionable advice based on portfolio data."
            },
            {
              role: "user",
              content: `Portfolio: $${context.totalValue.toLocaleString()} total, ${context.tokenCount} tokens, Risk: ${context.riskScore}/10. Top holdings: ${context.topHoldings.map(h => `${h.symbol} (${h.percentage.toFixed(1)}%)`).join(', ')}. Question: ${question}`
            }
          ],
          max_tokens: 300,
          temperature: 0.7,
        });

        answer = completion.choices[0]?.message?.content || '';
        console.log('✅ OpenAI response generated successfully');
      } catch (openaiError) {
        console.error('❌ OpenAI error:', openaiError);
      }
    }

    // Final fallback to contextual demo response
    if (!answer) {
      answer = generateContextualDemoResponse(question, context);
    }

    return NextResponse.json({ answer });

  } catch (error) {
    console.error('❌ AI Question API error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI question' },
      { status: 500 }
    );
  }
}

function generateContextualDemoResponse(question: string, context: any): string {
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes('risk')) {
    return `Based on your portfolio analysis, your current risk score is ${context.riskScore}/10. ${
      context.riskScore > 7 
        ? 'This is relatively high risk. Consider diversifying into more stable assets and reducing exposure to volatile tokens.'
        : context.riskScore > 4
        ? 'This represents moderate risk. Your portfolio has a good balance, but monitor your largest holdings closely.'
        : 'This is relatively low risk. Your portfolio appears well-diversified, though you might consider adding some growth assets for higher returns.'
    } Your top holding represents ${context.topHoldings[0]?.percentage.toFixed(1)}% of your portfolio.`;
  }
  
  if (questionLower.includes('rebalanc')) {
    const topHoldingPercentage = context.topHoldings[0]?.percentage || 0;
    return `Looking at your portfolio allocation, your top holding (${context.topHoldings[0]?.symbol}) represents ${topHoldingPercentage.toFixed(1)}% of your total value. ${
      topHoldingPercentage > 40
        ? 'This is quite concentrated. Consider reducing this position and diversifying into other assets to lower risk.'
        : topHoldingPercentage > 25
        ? 'This is a significant but reasonable allocation. Monitor this position closely and consider taking some profits if it grows further.'
        : 'Your allocation appears well-balanced. Continue monitoring and adjust based on market conditions and your investment goals.'
    }`;
  }
  
  if (questionLower.includes('sell')) {
    return `Based on your current holdings and ${context.netPnL >= 0 ? 'profitable' : 'loss'} position of $${Math.abs(context.netPnL).toLocaleString()}, consider reviewing tokens with the highest allocation first. Your ${context.topHoldings[0]?.symbol} position might be a candidate for partial profit-taking if it has grown significantly. Always consider tax implications and your long-term strategy before making any sells.`;
  }
  
  if (questionLower.includes('defi') || questionLower.includes('yield') || questionLower.includes('staking')) {
    return `With your current portfolio value of $${context.totalValue.toLocaleString()} and risk score of ${context.riskScore}/10, you might consider DeFi opportunities that match your risk profile. ${
      context.riskScore <= 4
        ? 'Look into established protocols like Aave, Compound, or Uniswap V3 for conservative yield farming.'
        : 'You might explore higher-yield opportunities in newer protocols, but always research thoroughly and never invest more than you can afford to lose.'
    }`;
  }
  
  // Default response
  return `Thank you for your question about your portfolio. With ${context.tokenCount} tokens valued at $${context.totalValue.toLocaleString()}, your portfolio shows ${context.netPnL >= 0 ? 'gains' : 'losses'} of $${Math.abs(context.netPnL).toLocaleString()}. Based on your current risk score of ${context.riskScore}/10, I'd recommend focusing on diversification and regular portfolio reviews. Feel free to ask more specific questions about your holdings or investment strategy.`;
}
