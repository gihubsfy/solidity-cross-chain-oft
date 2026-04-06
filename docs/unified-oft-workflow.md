# Unified OFT Workflow

`src/examples/UnifiedOFTWorkflow.sol` now uses a route-config model.

The owner registers routes first, then approved callers execute those routes.

## Source Route Config

Each source route stores:
- `tokenIn`
- `oftToken`
- `swapAdapter`
- `bridgeAdapter`
- `dstEid`
- `enabled`

## Destination Route Config

Each destination route stores:
- `oftToken`
- `payoutToken`
- `swapAdapter`
- `enabled`

## Runtime Calls

Source-chain runtime call:
- `swapAndBridge(routeId, amountIn, minBridgeAmount, recipient, sourceSwapData, bridgeOptions, composeMsg)`

Destination-chain runtime call:
- `swapReceivedOFT(routeId, oftAmountIn, minAmountOut, recipient, destinationSwapData)`

## What Is Fixed After Configuration

Fixed by owner configuration:
- source token
- destination OFT token
- destination payout token
- source swap adapter
- destination swap adapter
- bridge adapter
- destination endpoint id
- route enabled state
- caller whitelist
- adapter whitelists

## What Changes Per Call

Changes at runtime:
- amount in
- minimum acceptable output
- recipient
- swap calldata
- bridge options
- compose message

## Why This Boundary Is Better

This keeps business routes stable on-chain and leaves only trade-specific execution details dynamic.

That means adding a new chain or token pair usually becomes:
1. approve adapter addresses
2. register a new route
3. let approved callers use that route