import { toEnglishDigits } from "@/lib/utils/digits";

/** An Iranian bank: card BIN prefixes + IBAN (شبا) bank code for detection. */
export interface IranianBank {
  id: string; // stable slug
  name: string; // Persian name
  color: string; // brand color hex — fills the bank-mark tile (see BankLogo)
  cardBins: string[]; // 6-digit card BIN prefixes issued by this bank
  ibanCode: string; // 3-digit bank code embedded in the IBAN
}

// ponytail: covers the major retail banks (task list); BINs/IBAN codes are the
// commonly-published ones. Brand colors are best-effort — correct any that look
// off in the BankLogo tile.
export const IRANIAN_BANKS: IranianBank[] = [
  // Government Banks
  {
    id: "melli",
    name: "بانک ملی ایران",
    color: "#006C3B",
    cardBins: ["603799"],
    ibanCode: "017",
  },
  {
    id: "sepah",
    name: "بانک سپه",
    color: "#0057A6",
    cardBins: ["589210"],
    ibanCode: "015",
  },
  {
    id: "keshavarzi",
    name: "بانک کشاورزی",
    color: "#00843D",
    cardBins: ["603770", "639217"],
    ibanCode: "016",
  },
  {
    id: "maskan",
    name: "بانک مسکن",
    color: "#F39200",
    cardBins: ["628023"],
    ibanCode: "014",
  },
  {
    id: "mellat",
    name: "بانک ملت",
    color: "#D71920",
    cardBins: ["610433", "991975"],
    ibanCode: "012",
  },
  {
    id: "saderat",
    name: "بانک صادرات ایران",
    color: "#005CAA",
    cardBins: ["603769"],
    ibanCode: "019",
  },
  {
    id: "tejarat",
    name: "بانک تجارت",
    color: "#0059A8",
    cardBins: ["585983", "627353"],
    ibanCode: "018",
  },
  {
    id: "refah",
    name: "بانک رفاه کارگران",
    color: "#D71920",
    cardBins: ["589463"],
    ibanCode: "013",
  },
  {
    id: "post-bank",
    name: "پست بانک ایران",
    color: "#F5A623",
    cardBins: ["627760"],
    ibanCode: "021",
  },
  {
    id: "tosee-saderat",
    name: "بانک توسعه صادرات ایران",
    color: "#0054A6",
    cardBins: ["627648"],
    ibanCode: "020",
  },
  {
    id: "sanat-madan",
    name: "بانک صنعت و معدن",
    color: "#00529B",
    cardBins: ["627961"],
    ibanCode: "011",
  },
  {
    id: "tosee-taavon",
    name: "بانک توسعه تعاون",
    color: "#009245",
    cardBins: ["502908"],
    ibanCode: "022",
  },

  // Private Banks
  {
    id: "eghtesad-novin",
    name: "بانک اقتصاد نوین",
    color: "#F58220",
    cardBins: ["627412"],
    ibanCode: "055",
  },
  {
    id: "parsian",
    name: "بانک پارسیان",
    color: "#7D3C98",
    cardBins: ["622106", "627884", "639194"],
    ibanCode: "054",
  },
  {
    id: "pasargad",
    name: "بانک پاسارگاد",
    color: "#0057A8",
    cardBins: ["502229", "639347"],
    ibanCode: "057",
  },
  {
    id: "saman",
    name: "بانک سامان",
    color: "#7C2D86",
    cardBins: ["621986"],
    ibanCode: "056",
  },
  {
    id: "karafarin",
    name: "بانک کارآفرین",
    color: "#0054A6",
    cardBins: ["627488", "502910"],
    ibanCode: "053",
  },
  {
    id: "sina",
    name: "بانک سینا",
    color: "#009688",
    cardBins: ["639346"],
    ibanCode: "059",
  },
  {
    id: "shahr",
    name: "بانک شهر",
    color: "#F58220",
    cardBins: ["502806", "504706"],
    ibanCode: "061",
  },
  {
    id: "ayandeh",
    name: "بانک آینده",
    color: "#00A0DF",
    cardBins: ["636214"],
    ibanCode: "062",
  },
  {
    id: "dey",
    name: "بانک دی",
    color: "#F4B400",
    cardBins: ["502938"],
    ibanCode: "066",
  },
  {
    id: "gardeshgari",
    name: "بانک گردشگری",
    color: "#00A79D",
    cardBins: ["505416", "505426"],
    ibanCode: "064",
  },
  {
    id: "iran-zamin",
    name: "بانک ایران زمین",
    color: "#1E4B8F",
    cardBins: ["505785"],
    ibanCode: "069",
  },
  {
    id: "khavarmiane",
    name: "بانک خاورمیانه",
    color: "#8C6B3F",
    cardBins: ["585947"],
    ibanCode: "078",
  },
  {
    id: "mehr-iran",
    name: "بانک قرض‌الحسنه مهر ایران",
    color: "#00A651",
    cardBins: ["606373"],
    ibanCode: "060",
  },
  {
    id: "resalat",
    name: "بانک قرض‌الحسنه رسالت",
    color: "#00A651",
    cardBins: ["504172"],
    ibanCode: "070",
  },

  // Legacy Banks (Merged into Sepah)
  {
    id: "ansar",
    name: "بانک انصار",
    color: "#009245",
    cardBins: ["627381"],
    ibanCode: "065",
  },
  {
    id: "ghavamin",
    name: "بانک قوامین",
    color: "#00843D",
    cardBins: ["639599"],
    ibanCode: "052",
  },
  {
    id: "hekmat",
    name: "بانک حکمت ایرانیان",
    color: "#0057A6",
    cardBins: ["636949"],
    ibanCode: "063",
  },
  {
    id: "mehr-eghtesad",
    name: "بانک مهر اقتصاد",
    color: "#0054A6",
    cardBins: ["639370"],
    ibanCode: "067",
  },
];

function normalizeDigits(value: string): string {
  return toEnglishDigits(value).toUpperCase().replace(/[\s-]/g, "");
}

/** First 6 digits of a card number → issuing bank, or null if unrecognized. */
export function detectBankByCard(number: string): IranianBank | null {
  const digits = normalizeDigits(number);
  const bin = digits.slice(0, 6);
  if (!/^\d{6}$/.test(bin)) return null;
  return IRANIAN_BANKS.find((bank) => bank.cardBins.includes(bin)) ?? null;
}

/** IBAN's embedded 3-digit bank code (positions 3–5 of the 24-digit body) → issuing bank, or null. */
export function detectBankByIban(value: string): IranianBank | null {
  let body = normalizeDigits(value);
  if (body.startsWith("IR")) body = body.slice(2);
  if (!/^\d{24}$/.test(body)) return null;
  const code = body.slice(2, 5);
  return IRANIAN_BANKS.find((bank) => bank.ibanCode === code) ?? null;
}

/** True only if the card and IBAN both resolve to the same bank. */
export function sameBank(cardNumber: string, ibanValue: string): boolean {
  const card = detectBankByCard(cardNumber);
  const iban = detectBankByIban(ibanValue);
  return card !== null && iban !== null && card.id === iban.id;
}
