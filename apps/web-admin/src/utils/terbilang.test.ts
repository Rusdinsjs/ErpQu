import { describe, it, expect } from "vitest";
import { terbilang } from "./terbilang";

describe("terbilang utility", () => {
    it("should format 0 correctly", () => {
        expect(terbilang(0)).toBe("Nol Rupiah");
        expect(terbilang("0")).toBe("Nol Rupiah");
    });

    it("should format satuan correctly", () => {
        expect(terbilang(1)).toBe("Satu Rupiah");
        expect(terbilang(7)).toBe("Tujuh Rupiah");
    });

    it("should format belasan correctly", () => {
        expect(terbilang(11)).toBe("Sebelas Rupiah");
        expect(terbilang(17)).toBe("Tujuh Belas Rupiah");
    });

    it("should format puluhan correctly", () => {
        expect(terbilang(20)).toBe("Dua Puluh Rupiah");
        expect(terbilang(45)).toBe("Empat Puluh Lima Rupiah");
    });

    it("should format ratusan dan seratus correctly", () => {
        expect(terbilang(100)).toBe("Seratus Rupiah");
        expect(terbilang(105)).toBe("Seratus Lima Rupiah");
        expect(terbilang(350)).toBe("Tiga Ratus Lima Puluh Rupiah");
    });

    it("should format ribuan dan seribu correctly", () => {
        expect(terbilang(1000)).toBe("Seribu Rupiah");
        expect(terbilang(1500)).toBe("Seribu Lima Ratus Rupiah");
        expect(terbilang(25000)).toBe("Dua Puluh Lima Ribu Rupiah");
    });

    it("should format jutaan correctly", () => {
        expect(terbilang(1000000)).toBe("Satu Juta Rupiah");
        expect(terbilang(15750000)).toBe("Lima Belas Juta Tujuh Ratus Lima Puluh Ribu Rupiah");
    });

    it("should format miliaran correctly", () => {
        expect(terbilang(1500000000)).toBe("Satu Miliar Lima Ratus Juta Rupiah");
    });
});
