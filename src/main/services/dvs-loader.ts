let dvsCache: typeof import('@dank074/discord-video-stream') | null = null;

export async function getDvs(): Promise<typeof import('@dank074/discord-video-stream')> {
  if (dvsCache) {
    return dvsCache;
  }
  // Dynamic import using Function constructor avoids TypeScript transpiling it into require()
  const dynamicImport = new Function('specifier', 'return import(specifier)');
  const mod = (await dynamicImport('@dank074/discord-video-stream')) as typeof import('@dank074/discord-video-stream');
  dvsCache = mod;
  return mod;
}

