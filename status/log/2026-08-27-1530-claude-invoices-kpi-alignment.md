# 2026-08-27 15:30 — Claude Code — invoices tab KPI card alignment

## Problem

On the Invoices tab, the two KPI cards ("Outstanding" and "Paid to date") had
visibly misaligned text — the label and value in each card sat at different
left/top positions, so side by side they looked broken.

## Cause

In `app/(app)/invoices/index.tsx` the first card passed `padding={12}` but the
second card passed no `padding`, so it used the `Card` component default of 20px.
Different internal padding = different text origin in each card.

## Fix

Added `padding={12}` to the second card so both match.

`npx tsc --noEmit` passes from `mobile/`. Not verified on-device (no
simulator this session).
