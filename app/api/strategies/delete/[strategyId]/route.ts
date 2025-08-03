import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import StrategyModel from '@/models/Strategy';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { strategyId: string } }
) {
  try {
    const { strategyId } = params;
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!strategyId) {
      return NextResponse.json(
        { success: false, error: 'Strategy ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find and delete the strategy, ensuring it belongs to the requesting wallet
    // Use strategyId field instead of _id since we use custom strategy IDs
    const deletedStrategy = await StrategyModel.findOneAndDelete({
      strategyId: strategyId,
      walletAddress: walletAddress,
    });

    if (!deletedStrategy) {
      return NextResponse.json(
        { success: false, error: 'Strategy not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Strategy deleted successfully',
      data: {
        id: deletedStrategy.strategyId,
        mongoId: deletedStrategy._id,
        name: deletedStrategy.name,
      },
    });
  } catch (error) {
    console.error('Error deleting strategy:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
