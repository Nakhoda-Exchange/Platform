import { describe, expect, test } from "bun:test";
import { tierFor } from "./referral";

describe("tierFor", () => {
  test("tiers step at 10 and 50 active invitees, capped at 50%", () => {
    expect(tierFor(0).current.sharePercent).toBe(30);
    expect(tierFor(9).current.sharePercent).toBe(30);
    expect(tierFor(10).current.sharePercent).toBe(40);
    expect(tierFor(49).next?.sharePercent).toBe(50);
    expect(tierFor(50).current.sharePercent).toBe(50);
    expect(tierFor(200).next).toBeUndefined();
  });
});
