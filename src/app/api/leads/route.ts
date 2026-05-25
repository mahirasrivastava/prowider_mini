import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import { allocateProviders } from '@/lib/allocation';
import { getMutex } from '@/lib/mutex';

export async function POST(request: Request) {
  // Acquire global lead allocation mutex to serialize allocation calculations
  const mutex = getMutex('lead_allocation');
  const release = await mutex.acquire();

  try {
    await dbConnect();
    const body = await request.json();
    const { name, phoneNumber, city, service, description } = body;

    // Validate inputs
    if (!name || !phoneNumber || !city || !service || !description) {
      return NextResponse.json(
        { error: 'All fields (name, phoneNumber, city, service, description) are required.' },
        { status: 400 }
      );
    }

    if (!['Service 1', 'Service 2', 'Service 3'].includes(service)) {
      return NextResponse.json({ error: 'Invalid service type.' }, { status: 400 });
    }

    // 1. Create and save the lead (this tests the unique compound index on phoneNumber + service)
    let lead;
    try {
      lead = new Lead({
        name,
        phoneNumber,
        city,
        service,
        description,
        assignedProviders: [],
      });
      await lead.save();
    } catch (err: any) {
      // MongoDB duplicate key error code is 11000
      if (err.code === 11000) {
        return NextResponse.json(
          { error: 'A lead with this phone number and service type already exists.' },
          { status: 409 } // Conflict
        );
      }
      throw err;
    }

    // 2. Perform the provider allocation
    try {
      const assignedProviders = await allocateProviders(service);
      
      // 3. Update the lead with the successfully assigned provider IDs
      lead.assignedProviders = assignedProviders.map((p) => p._id as any);
      await lead.save();

      return NextResponse.json({
        success: true,
        leadId: lead._id,
        assignedProviders: assignedProviders.map((p) => ({
          providerId: p.providerId,
          name: p.name,
          leadsCount: p.leadsCount,
        })),
      }, { status: 201 });

    } catch (allocError: any) {
      // Rollback: if provider allocation fails (e.g. quota limit), delete the lead
      await Lead.deleteOne({ _id: lead._id });
      return NextResponse.json(
        { error: allocError.message || 'Failed to allocate providers.' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Lead submission error:', error);
    return NextResponse.json({ error: 'Internal Server Error.' }, { status: 500 });
  } finally {
    // ALWAYS release the mutex to let the next request execute
    release();
  }
}
