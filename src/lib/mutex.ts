export class Mutex {
  private queue: Promise<void> = Promise.resolve();

  /**
   * Acquires the lock. Returns a release function.
   * Call the release function when the critical section is done.
   */
  async acquire(): Promise<() => void> {
    let release: () => void;
    
    // Create a promise that will resolve when the lock is released
    const nextQueue = new Promise<void>((resolve) => {
      release = resolve;
    });

    // Capture the current head of the queue
    const currentQueue = this.queue;

    // Set the new queue head to wait for the release of this lock
    this.queue = currentQueue.then(() => nextQueue).catch(() => nextQueue);

    // Wait for the current queue head to finish
    await currentQueue;

    // Return the release function to the caller
    return release!;
  }
}

// Persist mutexes across Next.js hot-reloads in development
const globalMutexes = (global as any).mutexes || {};
if (!(global as any).mutexes) {
  (global as any).mutexes = globalMutexes;
}

export function getMutex(key: string): Mutex {
  if (!globalMutexes[key]) {
    globalMutexes[key] = new Mutex();
  }
  return globalMutexes[key];
}
