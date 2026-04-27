import { Assets } from 'pixi.js';

interface BundleAsset {
  alias: string;
  src: string;
  data?: Record<string, unknown>;
}

const registeredBundles = new Set<string>();

export function ensureAssetBundle(
  bundleId: string,
  assets: readonly BundleAsset[],
): string {
  if (!registeredBundles.has(bundleId)) {
    Assets.addBundle(bundleId, [...assets]);
    registeredBundles.add(bundleId);
  }

  return bundleId;
}
