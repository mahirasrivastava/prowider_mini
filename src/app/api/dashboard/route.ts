import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Provider from '@/models/Provider';
import Lead from '@/models/Lead';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();

    // 1. Fetch all providers sorted by their providerId
    const providers = await Provider.find({}).sort({ providerId: 1 }).lean();

    // 2. Fetch all leads, sorted by newest first
    const leads = await Lead.find({})
      .sort({ createdAt: -1 })
      .lean();

    // 3. Map leads to their assigned providers
    const providersWithLeads = providers.map((provider: any) => {
      // Find all leads where the provider's ObjectId is in the assignedProviders array
      const assignedLeads = leads
        .filter((lead: any) =>
          lead.assignedProviders.some(
            (id: any) => id.toString() === provider._id.toString()
          )
        )
        .map((lead: any) => ({
          _id: lead._id.toString(),
          name: lead.name,
          phoneNumber: lead.phoneNumber,
          city: lead.city,
          service: lead.service,
          description: lead.description,
          createdAt: lead.createdAt,
        }));

      return {
        _id: provider._id.toString(),
        providerId: provider.providerId,
        name: provider.name,
        leadsCount: provider.leadsCount,
        remainingQuota: Math.max(0, 10 - provider.leadsCount),
        lastAssignedAt: provider.lastAssignedAt,
        leads: assignedLeads,
      };
    });

    return NextResponse.json(
      { success: true, providers: providersWithLeads },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
