# Report 02 — Repository Audit
**Phase:** 2.2 | **Date:** 2026-06-01 | **Status:** ✅ PASSED (after fixes)

---

## Summary

| Repository | `as any` | RPC Calls | N+1 Risk | Severity | Status |
|---|---|---|---|---|---|
| productRepository.ts | 3 | 0 | Low | — | ✅ PASS |
| categoryRepository.ts | 0 | 0 | None | — | ✅ PASS |
| cartRepository.ts | 8 | 0 | Low | — | ✅ PASS |
| wishlistRepository.ts | 4 | 0 | Low | Medium | ✅ FIXED |
| inventoryRepository.ts | 4 | 3 | None | — | ✅ PASS* |
| couponRepository.ts | 2 | 1 | None | Medium | ✅ FIXED |
| orderRepository.ts | 6 | 0 | Low | — | ✅ PASS |

*RPC casts resolve after type generation.

---

## Findings by Severity

### Medium — Fixed ✅

**couponRepository.ts — `hasUserUsed()` silent error**
- Before: `const { data } = ... return !!data` — query errors returned as `false`
- After: `.maybeSingle()` + explicit `if (error) throw` — real errors now surface
- File: `src/lib/repositories/couponRepository.ts`

**wishlistRepository.ts — `hasItem()` silent error**
- Before: `const { data } = ... return !!data` — same pattern
- After: `.maybeSingle()` + explicit `if (error) throw` — real errors now surface
- File: `src/lib/repositories/wishlistRepository.ts`

### Low — Intentional (resolve after type generation)

**`as any` casts across all repositories**
- 15+ total casts — all intentional due to hand-crafted `database.types.ts`
- Pattern: `.insert({ ... } as any)`, `.update({ ... } as any)`, `(supabase as any).rpc(...)`
- Resolve completely after running `supabase gen types typescript`
- **No action needed now**

**Double cast `as unknown as T`**
- `orderRepository.ts` line 43: `data as unknown as OrderWithItems`
- `productRepository.ts` line 85: `data as unknown as ProductWithVariants`
- Caused by Supabase PostgREST join return type mismatch with hand-crafted types
- **Resolve after type generation**

### Low — Acceptable

**O(n×m) image processing**
- `cartRepository.getWithItems()`, `productRepository.findAll()`, `wishlistRepository.getItems()` — all call `.find()` per product item to locate primary image
- Acceptable: images per product are typically 3–8; no performance issue at scale
- PostgREST fetches all in single query; client-side processing only

---

## Architecture Compliance

- ✅ All 7 repositories are the only layer calling Supabase
- ✅ No business logic in any repository
- ✅ No cross-repository calls (each repo owns its tables)
- ✅ Error handling: all critical paths throw on failure

---

## Verdict: ✅ PASS
