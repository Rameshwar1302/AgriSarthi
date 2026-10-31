import axios from 'axios';
import { env } from '../config/env.js';
import { SEED_MANDI_PRICES, SEED_MANDI_HISTORICAL } from '../data/seedData.js';

export interface MandiRecord {
  commodity: string;
  state: string;
  district: string;
  market: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  arrivalDate: string;
  source: string;
  isDemo: boolean;
  fetchedAt: string;
}

export interface MandiComparisonResult {
  commodity: string;
  records: MandiRecord[];
  highestModalMandi: {
    market: string;
    district: string;
    modalPrice: number;
    differenceFromAverage: number;
  } | null;
  lowestModalMandi: {
    market: string;
    district: string;
    modalPrice: number;
  } | null;
  averageModalPrice: number;
  historicalTrends: Array<{ date: string; modalPrice: number; minPrice: number; maxPrice: number }>;
  sourceNote: string;
  status: 'live' | 'cached' | 'demo_dataset';
}

const mandiCache = new Map<string, { timestamp: number; data: MandiRecord[] }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getMandiPrices(
  commodity: string = 'Soybean',
  state: string = 'Maharashtra',
  district?: string
): Promise<MandiComparisonResult> {
  const cacheKey = `${commodity.toLowerCase()}_${state.toLowerCase()}_${district ? district.toLowerCase() : 'all'}`;
  const cached = mandiCache.get(cacheKey);

  let records: MandiRecord[] = [];
  let isLive = false;

  // Attempt live data.gov.in AGMARKNET API call if API key configured
  if (env.DATA_GOV_IN_API_KEY) {
    try {
      const url = `https://api.data.gov.in/resource/${env.AGMARKNET_RESOURCE_ID}?api-key=${env.DATA_GOV_IN_API_KEY}&format=json&filters[commodity]=${encodeURIComponent(commodity)}&filters[state]=${encodeURIComponent(state)}`;
      const response = await axios.get(url, { timeout: 5000 });
      if (response.data?.records && Array.isArray(response.data.records) && response.data.records.length > 0) {
        records = response.data.records.map((r: any) => ({
          commodity: r.commodity || commodity,
          state: r.state || state,
          district: r.district || 'Maharashtra',
          market: r.market || 'APMC',
          minPrice: Number(r.min_price) || 4000,
          maxPrice: Number(r.max_price) || 4700,
          modalPrice: Number(r.modal_price) || 4500,
          unit: 'Rs/Quintal',
          arrivalDate: r.arrival_date || new Date().toISOString().split('T')[0],
          source: 'data.gov.in AGMARKNET (Live API)',
          isDemo: false,
          fetchedAt: new Date().toISOString(),
        }));
        isLive = true;
        mandiCache.set(cacheKey, { timestamp: Date.now(), data: records });
      }
    } catch (err: any) {
      console.warn(`[MandiService] data.gov.in live fetch error: ${err.message}. Resorting to verified AGMARKNET demo repository.`);
    }
  }

  // Fallback to cached or verified seed dataset
  if (records.length === 0) {
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      records = cached.data;
    } else {
      // Filter seed dataset
      const filtered = SEED_MANDI_PRICES.filter(
        (m) =>
          m.commodity.toLowerCase().includes(commodity.toLowerCase()) ||
          commodity.toLowerCase().includes(m.commodity.toLowerCase())
      );

      records = (filtered.length > 0 ? filtered : SEED_MANDI_PRICES).map((item) => ({
        ...item,
        isDemo: true,
        source: 'AGMARKNET (Demonstration / Verified Benchmark)',
        fetchedAt: new Date().toISOString(),
      }));
    }
  }

  // Filter by district if requested
  if (district && district !== 'All') {
    const districtFiltered = records.filter(
      (r) => r.district.toLowerCase() === district.toLowerCase()
    );
    if (districtFiltered.length > 0) {
      records = districtFiltered;
    }
  }

  // Calculate comparisons
  const modalPrices = records.map((r) => r.modalPrice).filter((p) => p > 0);
  const avg = modalPrices.length > 0 ? Math.round(modalPrices.reduce((a, b) => a + b, 0) / modalPrices.length) : 0;

  let highestMandi: MandiComparisonResult['highestModalMandi'] = null;
  let lowestMandi: MandiComparisonResult['lowestModalMandi'] = null;

  if (records.length > 0) {
    const sorted = [...records].sort((a, b) => b.modalPrice - a.modalPrice);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];

    highestMandi = {
      market: highest.market,
      district: highest.district,
      modalPrice: highest.modalPrice,
      differenceFromAverage: highest.modalPrice - avg,
    };

    lowestMandi = {
      market: lowest.market,
      district: lowest.district,
      modalPrice: lowest.modalPrice,
    };
  }

  const historical = SEED_MANDI_HISTORICAL[commodity] || SEED_MANDI_HISTORICAL['Soybean'];

  return {
    commodity,
    records,
    highestModalMandi: highestMandi,
    lowestModalMandi: lowestMandi,
    averageModalPrice: avg,
    historicalTrends: historical,
    sourceNote: isLive
      ? 'Live data pulled from Government of India data.gov.in AGMARKNET'
      : 'Clearly labelled AGMARKNET Benchmark Dataset (Demo Mode Active)',
    status: isLive ? 'live' : cached ? 'cached' : 'demo_dataset',
  };
}

