import dbConnect from './db';
import Provider, { IProvider } from '@/models/Provider';

// Business Rules mapping
export const ALLOCATION_RULES = {
  'Service 1': {
    mandatory: [1],
    pool: [2, 3, 4],
  },
  'Service 2': {
    mandatory: [5],
    pool: [6, 7, 8],
  },
  'Service 3': {
    mandatory: [1, 4],
    pool: [2, 3, 5, 6, 7, 8],
  },
};

/**
 * Allocates exactly 3 providers for a given service.
 * Respects monthly quotas (max 10) and distributes pool slots fairly using round-robin.
 * Uses atomic updates to ensure data integrity.
 */
export async function allocateProviders(service: string): Promise<IProvider[]> {
  await dbConnect();

  const rule = ALLOCATION_RULES[service as keyof typeof ALLOCATION_RULES];
  if (!rule) {
    throw new Error(`Invalid service type: ${service}`);
  }

  // 1. Fetch all providers to get their current quota and assignment states
  const allProviders = await Provider.find({});
  const providerMap = new Map<number, IProvider>();
  allProviders.forEach((p) => providerMap.set(p.providerId, p));

  const assignedProviders: IProvider[] = [];

  // 2. Assign mandatory providers if they have quota available
  for (const mId of rule.mandatory) {
    const provider = providerMap.get(mId);
    if (provider && provider.leadsCount < 10) {
      assignedProviders.push(provider);
    }
  }

  // 3. Fill remaining slots from the designated fair pool
  const slotsNeeded = 3 - assignedProviders.length;
  if (slotsNeeded > 0) {
    const candidates = rule.pool
      .map((id) => providerMap.get(id))
      .filter((p): p is IProvider => {
        if (!p) return false;
        // Check monthly quota
        if (p.leadsCount >= 10) return false;
        // Prevent duplicate assignment of same provider
        if (assignedProviders.some((assigned) => assigned.providerId === p.providerId)) return false;
        return true;
      });

    // Round-Robin Sort:
    // - Sort by lastAssignedAt ascending (null or oldest first)
    // - Sub-sort by providerId for deterministic ordering when lastAssignedAt is equal
    candidates.sort((a, b) => {
      const timeA = a.lastAssignedAt ? a.lastAssignedAt.getTime() : 0;
      const timeB = b.lastAssignedAt ? b.lastAssignedAt.getTime() : 0;
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return a.providerId - b.providerId;
    });

    const chosenCandidates = candidates.slice(0, slotsNeeded);
    assignedProviders.push(...chosenCandidates);
  }

  // 4. Ensure we have exactly 3 providers
  if (assignedProviders.length < 3) {
    throw new Error(`Cannot assign exactly 3 providers. Quota exhausted. Providers available: ${assignedProviders.length}`);
  }

  // 5. Update provider state in database atomically
  const now = new Date();
  const updatePromises = assignedProviders.map(async (provider, index) => {
    const result = await Provider.updateOne(
      {
        _id: provider._id,
        leadsCount: { $lt: 10 }, // Double-check quota atomically at DB layer
      },
      {
        $inc: { leadsCount: 1 },
        // Offset lastAssignedAt by index milliseconds to serialize assignments in time,
        // avoiding tie-breaker favoritism when sorting by timestamp.
        $set: { lastAssignedAt: new Date(now.getTime() + index) },
      }
    );

    if (result.modifiedCount === 0) {
      throw new Error(`Provider ${provider.name} quota was exceeded or modified by a concurrent request.`);
    }
  });

  // Run all updates. If any fails, we propagate the error
  await Promise.all(updatePromises);

  return assignedProviders;
}
