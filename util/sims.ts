import { getCacheFromRedis } from '@app/util/redis';

// the proposal simulations of the app (api/drafts/sim) and their tenderly vnets
export const SIMS_CACHE_KEY = 'gp-sim-id';

// a vnet of the app's simulations: any other vnet can have any state (ex: fake logs or prices), its data must never be served
export const isAppSimVnet = async (vnetPublicId: string): Promise<boolean> => {
    const cachedSims = await getCacheFromRedis(SIMS_CACHE_KEY, false);
    return !!vnetPublicId && (cachedSims?.ids || []).some((sim: { publicId: string }) => sim.publicId === vnetPublicId);
}
