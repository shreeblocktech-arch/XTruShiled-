# XtruShield (Sentiren) — PRD & Build Log

## Original problem statement
Non-custodial multi-chain wallet (BTC/ETH/BSC/TRX) presented as an intelligent
digital-asset OS. Market → News → Security → AI Insight visibly connected.
React Native + Expo SDK 54 + TypeScript, FastAPI read-only proxy. Jewel/Luxury +
restrained Neon design on deep navy. See `docs/BRIEF.md` (v2 locked).

## Architecture
- **Frontend** (`/app/frontend`, Expo Router): dark theme in `src/theme.ts`
  (Outfit/Manrope fonts), provider abstractions in `src/providers/*`
  (Market/News/AI/Sentiment/Rpc/ChainExplorer — no UI imports vendors directly),
  centralized `src/services/marketService.ts` (React Query, 10s focus-gated poll,
  single batched quotes request, last-valid retention), wallet layer
  (`src/wallet/*`: real BIP-39 mnemonic via expo-crypto, SHA-256 checksum,
  secure-store persistence, PIN hash, Verified Asset Registry + demo balances).
- **Backend** (`/app/backend/server.py`): thin FastAPI proxy → CoinMarketCap
  (quotes/pulse, 30–60s server cache), alternative.me (Fear & Greed),
  CryptoPanic (news, mock fallback), Gemini 3 Flash via Emergent key (AI insight).
  No keys or signing on device.

## Personas
- Self-custody crypto holder wanting a secure, intelligent, dense fintech wallet.

## Locked decisions honored
- Feature flags (`src/config/featureFlags.ts`): Card/Hardware/Swap/Solana gated
  with placeholders. Web wallet create enabled for preview + banner shown.
- Solana not exposed anywhere (wallet or Network Security).
- Providers swappable behind interfaces.

## Implemented (2026-06)
- Phase 0: feature flags, provider interfaces, secure-store keys, gated
  Card/Hardware placeholders, web-preview banner.
- Onboarding: create (real 12-word BIP-39), reveal/backup, verify quiz, PIN,
  import.
- Home (redesigned 2026-09-30 to Trust-Wallet-style reference after user
  feedback): wallet pill header + history/scan round buttons, promo banner,
  cardless portfolio hero (big balance, colored delta, compact chart with
  floating 1D/1W/1M/1Y chips, live indicator), 4 large action buttons
  (Send/Receive/Swap/Buy), Tokens section with clean 2-line rows
  (icon | name/balance | fiat/24h% — NO per-row sparklines), View all pill,
  then Market Pulse, AI Insight (Gemini), Security, Latest headlines.
  Layout hardened: global maxFontSizeMultiplier 1.15, numberOfLines guards,
  responsive sparkline widths.
- Phase 2: Asset Detail sheet (Activity/Market/Security/More + registry card),
  progressive Send (recipient→amount→fee→security check→review→PIN→signing→
  broadcast→confirmation; RED block; unverified acknowledgement), Receive
  payment-request (QR, amount/message/expiry, share).
- Phase 3: Verified Asset Registry across dashboard/detail/receive/send.
- Phase 4: Discover restructured (Security/Market/AI/Tools/DApps) + live
  connective intelligence card.
- Phase 5/6: Security & Network screen (score, threats, tx firewall, DApp
  sessions, per-chain RPC health rows BTC/ETH/BSC/TRX).

## Backlog / remaining (P1/P2)
- P1: real EC key derivation + signing (needs native dev client), real
  CryptoPanic key wiring, per-timeframe real historical charts.
- P1: full DApp browser / WalletConnect sessions, Swap routing.
- P2: Card issuer/KYC integration, Ledger BLE, price alerts/converter/gas tracker.

## Next tasks
- Wire real CryptoPanic key when provided; add price-alert + gas tracker tools.
