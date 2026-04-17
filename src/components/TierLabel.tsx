import { Text } from "ink";

import type { Tier } from "../lib/catalog";

const TIER_COLOR: Record<Tier, string> = {
  easy: "green",
  medium: "cyan",
  hard: "yellow",
  elite: "magenta",
  master: "red",
};

export function TierLabel({ tier, bold }: { tier: Tier; bold?: boolean }) {
  return (
    <Text color={TIER_COLOR[tier]} bold={bold}>
      {tier}
    </Text>
  );
}

export function tierColor(tier: Tier): string {
  return TIER_COLOR[tier];
}
