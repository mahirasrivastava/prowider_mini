import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Provider from '@/models/Provider';
import Lead from '@/models/Lead';
import ProcessedPayment from '@/models/ProcessedPayment';

export async function POST() {
  try {
    await dbConnect();

    // Delete all leads and payments
    await Lead.deleteMany({});
    await ProcessedPayment.deleteMany({});

    // Reset all providers back to 0 leads count
    await Provider.updateMany(
      {},
      {
        $set: {
          leadsCount: 0,
          lastAssignedAt: null,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'System state reset successful (0 leads, quotas set to 10).',
    });
  } catch (error: any) {
    console.error('Test system reset error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
