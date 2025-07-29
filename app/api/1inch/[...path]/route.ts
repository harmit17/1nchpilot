import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = 'https://api.1inch.dev';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey');
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    // Reconstruct the path
    const path = params.path.join('/');
    const endpoint = `/${path}`;
    
    // Remove apiKey from searchParams for the actual API call
    const apiParams = new URLSearchParams(searchParams);
    apiParams.delete('apiKey');
    
    console.log('🔄 Proxying 1inch API call:', `${API_BASE_URL}${endpoint}`);
    console.log('📋 API Parameters:', apiParams.toString());
    
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      params: Object.fromEntries(apiParams),
    });
    
    console.log('✅ 1inch API Response received');
    return NextResponse.json(response.data);
    
  } catch (error: any) {
    console.error('❌ 1inch API Proxy Error:', error.response?.data || error.message);
    
    return NextResponse.json(
      { 
        error: error.response?.data?.message || 'API request failed',
        details: error.response?.data 
      },
      { status: error.response?.status || 500 }
    );
  }
} 