import os from "os";

export function nameToInt(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    // Standard fast bitwise hashing algorithm (DJB2 style)
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0; // Convert to a 32-bit integer
  }
  return Math.abs(hash); // Ensure it's a positive number
}

export function hasEnoughRam(requestedMb: number, currentUsedMb: number): boolean {
  const totalMb = os.totalmem() / 1024 / 1024;
  const safetyMarginMb = Number(process.env.RAM_SAFETY_MARGIN_MB ?? 512);

  return currentUsedMb + requestedMb <= totalMb - safetyMarginMb;
}

// first base >= `base` (stepping by `step`) where base+every offset is free.
// offsets covers multi-port games, e.g. valheim binds base and base+1.
export function firstFreePort(base: number, step: number, usedPorts: Set<number>, offsets: number[] = [0]): number {
  const span = Math.max(...offsets);
  for (let port = base; port + span <= 65535; port += step) {
    if (offsets.every(o => !usedPorts.has(port + o))) return port;
  }
  throw new Error("New host port exceeds the max port count");
}
