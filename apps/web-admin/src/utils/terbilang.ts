/**
 * Indonesian Number to Words (Terbilang) Utility
 * Converts numbers into formal Indonesian rupiah words (e.g. 15750000 -> "Lima Belas Juta Tujuh Ratus Lima Puluh Ribu Rupiah")
 */

const SATUAN = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
];

function bilanganKeKata(n: number): string {
    const num = Math.floor(Math.abs(n));

    if (num < 12) {
        return SATUAN[num];
    }
    if (num < 20) {
        return `${bilanganKeKata(num - 10)} Belas`;
    }
    if (num < 100) {
        const sisa = num % 10;
        return `${bilanganKeKata(Math.floor(num / 10))} Puluh${sisa > 0 ? ` ${bilanganKeKata(sisa)}` : ''}`;
    }
    if (num < 200) {
        const sisa = num - 100;
        return `Seratus${sisa > 0 ? ` ${bilanganKeKata(sisa)}` : ''}`;
    }
    if (num < 1000) {
        const sisa = num % 100;
        return `${bilanganKeKata(Math.floor(num / 100))} Ratus${sisa > 0 ? ` ${bilanganKeKata(sisa)}` : ''}`;
    }
    if (num < 2000) {
        const sisa = num - 1000;
        return `Seribu${sisa > 0 ? ` ${bilanganKeKata(sisa)}` : ''}`;
    }
    if (num < 1000000) {
        const sisa = num % 1000;
        return `${bilanganKeKata(Math.floor(num / 1000))} Ribu${sisa > 0 ? ` ${bilanganKeKata(sisa)}` : ''}`;
    }
    if (num < 1000000000) {
        const sisa = num % 1000000;
        return `${bilanganKeKata(Math.floor(num / 1000000))} Juta${sisa > 0 ? ` ${bilanganKeKata(sisa)}` : ''}`;
    }
    if (num < 1000000000000) {
        const sisa = num % 1000000000;
        return `${bilanganKeKata(Math.floor(num / 1000000000))} Miliar${sisa > 0 ? ` ${bilanganKeKata(sisa)}` : ''}`;
    }
    if (num < 1000000000000000) {
        const sisa = num % 1000000000000;
        return `${bilanganKeKata(Math.floor(num / 1000000000000))} Triliun${sisa > 0 ? ` ${bilanganKeKata(sisa)}` : ''}`;
    }

    return num.toString();
}

/**
 * Konversi angka ke terbilang rupiah
 * @param amount Nilai nominal
 * @param suffix Akhiran (default: "Rupiah")
 */
export function terbilang(amount: number | string, suffix: string = 'Rupiah'): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(num) || num === 0) {
        return `Nol ${suffix}`.trim();
    }

    const isNegative = num < 0;
    const kata = bilanganKeKata(Math.abs(num)).replace(/\s+/g, ' ').trim();
    const prefix = isNegative ? 'Minus ' : '';

    return `${prefix}${kata} ${suffix}`.trim();
}
