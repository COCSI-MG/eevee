import { matchesExpected, parseBase, toBytes } from "./architecture";
describe("Architecture practice calculations", () => {
  it("handles binary, hexadecimal and fractional representations", () => {
    expect(parseBase("00101101", 2)).toBe(45);
    expect(parseBase("fe", 16)).toBe(254);
    expect(parseBase("0.101", 2)).toBe(0.625);
  });
  it("rejects invalid digits, non-finite values and unsafe integers", () => {
    for (const value of ["102", "-1", "Infinity", "", "1e2"])
      expect(() => parseBase(value, 2)).toThrow();
    expect(() => parseBase("999999999999999999999", 10)).toThrow();
  });
  it("distinguishes SI/IEC units and bits/bytes", () => {
    expect(toBytes("4", "MiB")).toBe(4194304);
    expect(toBytes("4", "MB")).toBe(4000000);
    expect(toBytes("8", "bit")).toBe(1);
    expect(matchesExpected(parseBase("0.101", 2), "0.625")).toBe(true);
    expect(matchesExpected(4000000, "4194304")).toBe(false);
  });
});
