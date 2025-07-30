// File: app/api/1inch/[...slug]/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Securely get the API Base URL and Key from server-side environment variables.
const API_BASE_URL = process.env.NEXT_PUBLIC_1INCH_API_URL || 'https://api.1inch.dev';
const API_KEY = process.env.NEXT_PUBLIC_1INCH_API_KEY;

/**
 * This is a "catch-all" API route. It will handle all GET requests to /api/1inch/*
 * and securely proxy them to the official 1inch API.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } } // Using 'slug' to match the folder name [...slug]
) {
  // 1. SERVER-SIDE CHECK: Ensure the API key is configured on the server.
  if (!API_KEY) {
    console.error('❌ CRITICAL: 1INCH_API_KEY is not configured in server environment variables.');
    return NextResponse.json(
      { error: 'Server is not configured for 1inch API access.' },
      { status: 500 }
    );
  }

  // 2. RECONSTRUCT PATH: Join the segments from the URL.
  // e.g., for a request to /api/1inch/token/v1.2/42161, params.slug will be ['token', 'v1.2', '42161']
  const path = params.slug.join('/');

  // 3. FORWARD QUERY PARAMS: Get the original query string from the client's request.
  // e.g., if the request was /.../prices?tokens=0x123, this will be "?tokens=0x123"
  const { search } = new URL(request.url);

  // 4. BUILD THE FINAL URL for the real 1inch API.
  const finalUrl = `${API_BASE_URL}/${path}${search}`;

  console.log(`🔄 Proxying GET request to: ${finalUrl}`);

  try {
    // 5. MAKE THE REQUEST: Use the native `fetch` API to call the 1inch API.
    const apiResponse = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        // 6. SECURELY ADD AUTHORIZATION: The API key is added here, on the server.
        // It is never exposed to the client's browser.
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
      },
      // 7. CONTROL CACHING: 'no-store' ensures you always get fresh data (balances, prices).
      cache: 'no-store',
    });

    // 8. HANDLE 1INCH API ERRORS: If 1inch returns an error (like 404, 429), forward it.
    if (!apiResponse.ok) {
      const errorBody = await apiResponse.json();
      console.error(`❌ Error from 1inch API (Status: ${apiResponse.status}):`, errorBody);
      // Return the error from 1inch back to our frontend.
      return NextResponse.json(errorBody, { status: apiResponse.status });
    }

    // 9. SUCCESS: If the request was successful, return the data to the client.
    const data = await apiResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    // This catches network errors if the fetch itself fails (e.g., 1inch server is down).
    console.error('❌ Unhandled error in API proxy:', error);
    return NextResponse.json({ error: 'Internal Server Error in proxy.' }, { status: 500 });
  }
}