import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Strategy from '@/models/Strategy';

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();

    const body = await request.json();
    const { 
      walletAddress, 
      name, 
      description, 
      targetAllocation, 
      driftThreshold = 5, 
      autoRebalance = false,
      chainId = 1 
    } = body;

    // Validate required fields
    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!name || !targetAllocation || !Array.isArray(targetAllocation)) {
      return NextResponse.json(
        { success: false, error: 'Strategy name and target allocation are required' },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Validate allocation percentages sum to 100
    const totalPercentage = targetAllocation.reduce((sum: number, allocation: any) => {
      return sum + (allocation.targetPercentage || 0);
    }, 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
      return NextResponse.json(
        { success: false, error: `Total allocation must equal 100%. Current total: ${totalPercentage}%` },
        { status: 400 }
      );
    }

    // Generate unique strategy ID
    const strategyId = `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new strategy
    const strategy = new Strategy({
      walletAddress: walletAddress.toLowerCase(),
      strategyId,
      name: name.trim(),
      description: description?.trim(),
      targetAllocation,
      driftThreshold,
      autoRebalance,
      chainId,
      isActive: true,
    });

    // Save to database
    const savedStrategy = await strategy.save();

    return NextResponse.json({
      success: true,
      data: {
        id: savedStrategy.strategyId,
        mongoId: savedStrategy._id,
        name: savedStrategy.name,
        description: savedStrategy.description,
        targetAllocation: savedStrategy.targetAllocation,
        isActive: savedStrategy.isActive,
        createdAt: savedStrategy.createdAt,
        walletAddress: savedStrategy.walletAddress,
        chainId: savedStrategy.chainId,
        totalPercentage: savedStrategy.getTotalPercentage(),
        isValidAllocation: savedStrategy.isValidAllocation(),
      },
      message: 'Strategy created successfully'
    });

  } catch (error: any) {
    console.error('❌ Error creating strategy:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A strategy with this ID already exists' },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: `Validation error: ${validationErrors.join(', ')}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create strategy' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Find strategies for this wallet
    const strategies = await Strategy.findByWallet(walletAddress);

    const formattedStrategies = strategies.map((strategy: any) => ({
      id: strategy.strategyId,
      mongoId: strategy._id,
      name: strategy.name,
      description: strategy.description,
      targetAllocation: strategy.targetAllocation,
      isActive: strategy.isActive,
      driftThreshold: strategy.driftThreshold,
      autoRebalance: strategy.autoRebalance,
      chainId: strategy.chainId,
      totalInvestmentETH: strategy.totalInvestmentETH,
      totalInvestmentUSD: strategy.totalInvestmentUSD,
      createdAt: strategy.createdAt,
      updatedAt: strategy.updatedAt,
      totalPercentage: strategy.getTotalPercentage(),
      isValidAllocation: strategy.isValidAllocation(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedStrategies,
      count: formattedStrategies.length
    });

  } catch (error: any) {
    console.error('❌ Error fetching strategies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch strategies' },
      { status: 500 }
    );
  }
}
