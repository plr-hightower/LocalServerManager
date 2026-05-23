export function nameToInt(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    // Standard fast bitwise hashing algorithm (DJB2 style)
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0; // Convert to a 32-bit integer
  }
  return Math.abs(hash); // Ensure it's a positive number
}
