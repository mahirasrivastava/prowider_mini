import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ProcessedPayment from '@/models/ProcessedPayment';
import Provider from '@/models/Provider';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { paymentId, providerId } = body;

    // Validate inputs
    if (!paymentId || typeof providerId !== 'number') {
      return NextResponse.json(
        { error: 'Fields paymentId (string) and providerId (number) are required.' },
        { status: 400 }
      );
    }

    // 1. Enforce idempotency by writing to the ProcessedPayment table
    try {
      const paymentRecord = new ProcessedPayment({
        paymentId,
        providerId,
        processedAt: new Date(),
      });
      await paymentRecord.save();
    } catch (err: any) {
      // MongoDB duplicate key error code 11000
      if (err.code === 11000) {
        return NextResponse.json({
          success: true,
          message: 'Webhook already processed (idempotent, no changes made).',
          idempotent: true,
        }, { status: 200 });
      }
      throw err;
    }

    // 2. Fetch provider and reset their quota (leads count back to 0)
    const provider = await Provider.findOne({ providerId });
    if (!provider) {
      // Rollback the transaction record if the provider ID is invalid
      await ProcessedPayment.deleteOne({ paymentId });
      return NextResponse.json({ error: `Provider with ID ${providerId} not found.` }, { status: 404 });
    }

    provider.leadsCount = 0;
    await provider.save();

    return NextResponse.json({
      success: true,
      message: `Successfully reset quota to 10 for ${provider.name} (leads count set to 0).`,
      idempotent: false,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook endpoint error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
