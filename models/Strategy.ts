import mongoose, { Document, Model } from 'mongoose';

// Interface for Token Allocation
interface ITokenAllocation {
  token: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    chainId: number;
  };
  targetPercentage: number;
}

// Interface for Strategy Document
interface IStrategy extends Document {
  walletAddress: string;
  strategyId: string;
  name: string;
  description?: string;
  targetAllocation: ITokenAllocation[];
  isActive: boolean;
  driftThreshold: number;
  autoRebalance: boolean;
  chainId: number;
  totalInvestmentETH: string;
  totalInvestmentUSD: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  getTotalPercentage(): number;
  isValidAllocation(): boolean;
}

// Interface for Strategy Model (static methods)
interface IStrategyModel extends Model<IStrategy> {
  findByWallet(walletAddress: string): Promise<IStrategy[]>;
  findByWalletAndId(walletAddress: string, strategyId: string): Promise<IStrategy | null>;
}

// Token allocation schema
const TokenAllocationSchema = new mongoose.Schema({
  token: {
    address: { type: String, required: true },
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    decimals: { type: Number, required: true, default: 18 },
    chainId: { type: Number, required: true, default: 1 },
  },
  targetPercentage: { type: Number, required: true, min: 0, max: 100 },
});

// Main strategy schema
const StrategySchema = new mongoose.Schema({
  // Use wallet address as the primary identifier
  walletAddress: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    match: /^0x[a-fA-F0-9]{40}$/,
  },
  
  // Strategy details
  strategyId: {
    type: String,
    required: true,
    unique: true,
  },
  
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  
  description: {
    type: String,
    maxlength: 500,
  },
  
  targetAllocation: [TokenAllocationSchema],
  
  isActive: {
    type: Boolean,
    default: true,
  },
  
  driftThreshold: {
    type: Number,
    default: 5,
    min: 1,
    max: 50,
  },
  
  autoRebalance: {
    type: Boolean,
    default: false,
  },
  
  // Metadata
  chainId: {
    type: Number,
    default: 1,
  },
  
  totalInvestmentETH: {
    type: String,
    default: '0',
  },
  
  totalInvestmentUSD: {
    type: Number,
    default: 0,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
StrategySchema.index({ walletAddress: 1, isActive: 1 });
StrategySchema.index({ walletAddress: 1, createdAt: -1 });

// Pre-save middleware to update the updatedAt field
StrategySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
StrategySchema.methods.getTotalPercentage = function() {
  return this.targetAllocation.reduce((total: number, allocation: any) => {
    return total + allocation.targetPercentage;
  }, 0);
};

StrategySchema.methods.isValidAllocation = function() {
  return this.getTotalPercentage() === 100;
};

// Static methods
StrategySchema.statics.findByWallet = function(walletAddress: string) {
  return this.find({ 
    walletAddress: walletAddress.toLowerCase(),
    isActive: true 
  }).sort({ createdAt: -1 });
};

StrategySchema.statics.findByWalletAndId = function(walletAddress: string, strategyId: string) {
  return this.findOne({ 
    walletAddress: walletAddress.toLowerCase(),
    strategyId: strategyId,
    isActive: true 
  });
};

// Export the model
const Strategy: IStrategyModel = (mongoose.models.Strategy || mongoose.model<IStrategy, IStrategyModel>('Strategy', StrategySchema)) as IStrategyModel;

export default Strategy;
export { StrategySchema };
export type { IStrategy, ITokenAllocation };
