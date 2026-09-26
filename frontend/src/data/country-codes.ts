export interface CountryCode {
  name: string;
  iso: string;
  dialCode: string;
}

export const DEFAULT_COUNTRY_ISO = "ZW";

export const COUNTRY_CODES: CountryCode[] = [
  // Southern Africa
  { name: "Zimbabwe",                 iso: "ZW", dialCode: "263" },
  { name: "Botswana",                 iso: "BW", dialCode: "267" },
  { name: "Eswatini",                 iso: "SZ", dialCode: "268" },
  { name: "Lesotho",                  iso: "LS", dialCode: "266" },
  { name: "Malawi",                   iso: "MW", dialCode: "265" },
  { name: "Mozambique",               iso: "MZ", dialCode: "258" },
  { name: "Namibia",                  iso: "NA", dialCode: "264" },
  { name: "South Africa",             iso: "ZA", dialCode: "27" },
  { name: "Zambia",                   iso: "ZM", dialCode: "260" },
  // East Africa
  { name: "Ethiopia",                 iso: "ET", dialCode: "251" },
  { name: "Kenya",                    iso: "KE", dialCode: "254" },
  { name: "Rwanda",                   iso: "RW", dialCode: "250" },
  { name: "Tanzania",                 iso: "TZ", dialCode: "255" },
  { name: "Uganda",                   iso: "UG", dialCode: "256" },
  // West & Central Africa
  { name: "Cameroon",                 iso: "CM", dialCode: "237" },
  { name: "DR Congo",                 iso: "CD", dialCode: "243" },
  { name: "Ghana",                    iso: "GH", dialCode: "233" },
  { name: "Nigeria",                  iso: "NG", dialCode: "234" },
  { name: "Senegal",                  iso: "SN", dialCode: "221" },
  // North Africa
  { name: "Egypt",                    iso: "EG", dialCode: "20" },
  { name: "Morocco",                  iso: "MA", dialCode: "212" },
  // Rest of the world
  { name: "Australia",                iso: "AU", dialCode: "61" },
  { name: "Canada",                   iso: "CA", dialCode: "1" },
  { name: "China",                    iso: "CN", dialCode: "86" },
  { name: "India",                    iso: "IN", dialCode: "91" },
  { name: "United Arab Emirates",     iso: "AE", dialCode: "971" },
  { name: "United Kingdom",           iso: "GB", dialCode: "44" },
  { name: "United States",            iso: "US", dialCode: "1" },
];
