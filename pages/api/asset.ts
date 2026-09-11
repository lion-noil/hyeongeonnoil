// api/asset.ts
export const config = {runtime: "edge"};

import {Redis} from "@upstash/redis";

/* ------------------------- utils ------------------------- */
function json(payload: unknown, status = 200): Response {
    return new Response(JSON.stringify(payload), {
        headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
        },
        status,
    });
}

type HScanTuple = readonly [number | string, string[]];

async function hscanTyped(
    redis: Redis,
    key: string,
    cursor: number,
    opts: { match?: string; count?: number }
): Promise<[number, string[]]> {
    const res = (await (redis as any).hscan(
        key,
        cursor,
        opts
    )) as unknown as HScanTuple;

    const next =
        typeof res[0] === "string" ? parseInt(res[0], 10) : (res[0] as number);

    const arr = (res[1] ?? []) as string[];
    return [isNaN(next) ? 0 : next, arr];
}

function parsePositionVal(
    s: unknown
): { LONG: any | null; SHORT: any | null } | null {
    if (s == null) return null;

    if (typeof s === "object") {
        const obj = s as any;
        const LONG = obj?.LONG ?? null;
        const SHORT = obj?.SHORT ?? null;

        const isEmpty = (v: any) =>
            v == null || (typeof v === "object" && Object.keys(v).length === 0);

        if (isEmpty(LONG) && isEmpty(SHORT)) return null;
        return {LONG: stripLotIds(LONG), SHORT: stripLotIds(SHORT)};
    }

    if (typeof s !== "string") return null;

    const trimmed = s.trim();
    if (!trimmed || trimmed === "[]") return null;

    try {
        const obj = JSON.parse(trimmed);
        if (obj && typeof obj === "object") {
            const LONG = (obj as any).LONG ?? null;
            const SHORT = (obj as any).SHORT ?? null;

            const isEmpty = (v: any) =>
                v == null || (typeof v === "object" && Object.keys(v).length === 0);

            if (isEmpty(LONG) && isEmpty(SHORT)) return null;
            return {LONG: stripLotIds(LONG), SHORT: stripLotIds(SHORT)};
        }
    } catch {
    }

    return null;
}

/** 공개 응답에서 내부 lot id·거래소 주문 id 제거 (사이트/앱 UI 미사용, 주문 흐름 식별 노출 방지 — 2026-09-11 보안 검토) */
function stripLotIds(side: any): any {
    if (!side || typeof side !== "object") return side;
    const entries = Array.isArray(side.entries)
        ? side.entries.map((e: any) => {
            if (!e || typeof e !== "object") return e;
            const {lot_id, ex_lot_id, ...rest} = e;
            return rest;
        })
        : side.entries;
    return {...side, entries};
}

/* --------------------------- handler --------------------------- */
export default async function handler(req: Request): Promise<Response> {
    // 트레이딩 데이터는 로컬 Redis(터널). 미설정 시 Upstash로 폴백(무중단 롤아웃).
    const url = process.env.TRADING_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.TRADING_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        return json(
            {retCode: -1, retMsg: "Env missing UPSTASH_REDIS_REST_URL/TOKEN"},
            500
        );
    }

    try {
        const {searchParams} = new URL(req.url);

        /* ------------------- namespace ------------------- */
        // ⚠️ 대소문자 보존 (Redis key 그대로)
        const ns = (searchParams.get("ns") || "bybit").trim();

        // legacy 허용
        const LEGACY_ALLOW = new Set(["bybit", "mt5"]);

        // agent:<name>:<id>:<exchange>
        const parts = ns.split(":").filter(Boolean);
        const isAgentNs = parts[0] === "agent" && parts.length >= 4;

        const exchange = parts[parts.length - 1] || "";
        const EXCHANGE_ALLOW = new Set([
            "BYBIT",
            "bybit",
            "MT5",
            "mt5",
        ]);

        const ok =
            LEGACY_ALLOW.has(ns.toLowerCase()) ||
            (isAgentNs && EXCHANGE_ALLOW.has(exchange));

        if (!ok) {
            return json({retCode: -1, retMsg: "invalid ns"}, 400);
        }

        // ✅ 실제 Redis key
        const key = `trading:${ns}:asset`;

        const redis = new Redis({url, token});

        /* ------------------- query params ------------------- */
        const symbolsParam = searchParams.get("symbols") || "";
        const wantSymbols = symbolsParam
            .split(",")
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean);

        const walletCoin = (searchParams.get("wallet") || "USDT").toUpperCase();
        const includeEmpty =
            String(searchParams.get("includeEmpty") || "false").toLowerCase() ===
            "true";

        const scanCount = Math.min(
            Math.max(parseInt(searchParams.get("count") || "1000", 10) || 1000, 100),
            5000
        );

        /* ------------------- wallet ------------------- */
        const walletKey = `wallet.${walletCoin}`;
        const walletStr = await (redis as any).hget(key, walletKey);
        const walletVal =
            typeof walletStr === "string"
                ? parseFloat(walletStr)
                : Number(walletStr);

        const wallet = {
            [walletCoin]: isFinite(walletVal) ? walletVal : 0,
        };

        /* ---- 거래소 집계 평가액/미실현/갱신시각 (executor가 체결·5분 주기로 발행, 없으면 null) ---- */
        const numOrNull = (v: unknown): number | null => {
            const n = typeof v === "string" ? parseFloat(v) : Number(v);
            return Number.isFinite(n) ? n : null;
        };
        const [equityStr, unrealStr, updatedStr] = await Promise.all([
            (redis as any).hget(key, `equity.${walletCoin}`),
            (redis as any).hget(key, `unrealised.${walletCoin}`),
            (redis as any).hget(key, "updated_ms"),
        ]);
        const equity = numOrNull(equityStr);
        const unrealised = numOrNull(unrealStr);
        const updatedMs = numOrNull(updatedStr);

        /* ------------------- positions ------------------- */
        const positions: Record<string, any> = {};

        if (wantSymbols.length > 0) {
            for (const sym of wantSymbols) {
                const field = `positions.${sym}`;
                const v = await (redis as any).hget(key, field);
                const parsed = parsePositionVal(v);

                if (parsed) {
                    positions[sym] = {
                        LONG: parsed.LONG ?? null,
                        SHORT: parsed.SHORT ?? null,
                    };
                } else if (includeEmpty) {
                    positions[sym] = {LONG: null, SHORT: null};
                }
            }
        } else {
            let cursor = 0;

            do {
                const [next, arr] = await hscanTyped(redis, key, cursor, {
                    count: scanCount, // ✅ match 제거
                });
                cursor = next;

                for (let i = 0; i + 1 < arr.length; i += 2) {
                    const field = String(arr[i] ?? "");
                    const val = arr[i + 1];

                    // ✅ positions.* 만 직접 필터링
                    if (!field.startsWith("positions.")) continue;

                    const sym = field.slice("positions.".length).trim().toUpperCase();
                    if (!sym) continue;

                    const parsed = parsePositionVal(val);
                    if (parsed) {
                        positions[sym] = {
                            LONG: parsed.LONG ?? null,
                            SHORT: parsed.SHORT ?? null,
                        };
                    } else if (includeEmpty) {
                        positions[sym] = {LONG: null, SHORT: null};
                    }
                }
            } while (cursor !== 0);
        }

        const payload: any = {retCode: 0, asset: {wallet, positions, equity, unrealised, updatedMs}};

        // 15초 엣지 캐시: 익명 폴링이 매번 홈 Redis(터널)까지 가지 않게. executor 발행 주기(5분)·프론트 폴링(30초)보다 짧아 신선도 손실 없음.
        return new Response(JSON.stringify(payload), {
            status: 200,
            headers: {
                "content-type": "application/json; charset=utf-8",
                "cache-control": "public, s-maxage=15, stale-while-revalidate=60",
            },
        });
    } catch (e: any) {
        return json(
            {retCode: -1, retMsg: e?.message || "server error"},
            500
        );
    }
}
