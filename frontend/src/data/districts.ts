export interface District {
  name: string;
  province: string;
}

export const ZIMBABWE_DISTRICTS: District[] = [
  // Cities
  { name: "Bulawayo",                 province: "Bulawayo" },
  { name: "Harare",                   province: "Harare" },
  // Manicaland
  { name: "Buhera",                   province: "Manicaland" },
  { name: "Chimanimani",              province: "Manicaland" },
  { name: "Chipinge",                 province: "Manicaland" },
  { name: "Makoni",                   province: "Manicaland" },
  { name: "Mutare",                   province: "Manicaland" },
  { name: "Mutasa",                   province: "Manicaland" },
  { name: "Nyanga",                   province: "Manicaland" },
  // Mashonaland Central
  { name: "Bindura",                  province: "Mashonaland Central" },
  { name: "Chaminuka",                province: "Mashonaland Central" },
  { name: "Guruve",                   province: "Mashonaland Central" },
  { name: "Mazowe",                   province: "Mashonaland Central" },
  { name: "Mbire",                    province: "Mashonaland Central" },
  { name: "Muzarabani",               province: "Mashonaland Central" },
  { name: "Pfura",                    province: "Mashonaland Central" },
  { name: "Rushinga",                 province: "Mashonaland Central" },
  // Mashonaland East
  { name: "Chikomba",                 province: "Mashonaland East" },
  { name: "Goromonzi",                province: "Mashonaland East" },
  { name: "Hwedza",                   province: "Mashonaland East" },
  { name: "Manyame",                  province: "Mashonaland East" },
  { name: "Marondera",                province: "Mashonaland East" },
  { name: "Mudzi",                    province: "Mashonaland East" },
  { name: "Murewa",                   province: "Mashonaland East" },
  { name: "Mutoko",                   province: "Mashonaland East" },
  { name: "Uzumba-Maramba-Pfungwe",   province: "Mashonaland East" },
  // Mashonaland West
  { name: "Chegutu",                  province: "Mashonaland West" },
  { name: "Hurungwe",                 province: "Mashonaland West" },
  { name: "Makonde",                  province: "Mashonaland West" },
  { name: "Mhondoro-Ngezi",           province: "Mashonaland West" },
  { name: "Nyaminyami",               province: "Mashonaland West" },
  { name: "Sanyati",                  province: "Mashonaland West" },
  { name: "Zvimba",                   province: "Mashonaland West" },
  // Masvingo
  { name: "Bikita",                   province: "Masvingo" },
  { name: "Chiredzi",                 province: "Masvingo" },
  { name: "Chivi",                    province: "Masvingo" },
  { name: "Gutu",                     province: "Masvingo" },
  { name: "Masvingo",                 province: "Masvingo" },
  { name: "Mwenezi",                  province: "Masvingo" },
  { name: "Zaka",                     province: "Masvingo" },
  // Matabeleland North
  { name: "Binga",                    province: "Matabeleland North" },
  { name: "Bubi",                     province: "Matabeleland North" },
  { name: "Hwange",                   province: "Matabeleland North" },
  { name: "Kusile",                   province: "Matabeleland North" },
  { name: "Nkayi",                    province: "Matabeleland North" },
  { name: "Tsholotsho",               province: "Matabeleland North" },
  { name: "Umguza",                   province: "Matabeleland North" },
  // Matabeleland South
  { name: "Beitbridge",               province: "Matabeleland South" },
  { name: "Bulilima",                 province: "Matabeleland South" },
  { name: "Gwanda",                   province: "Matabeleland South" },
  { name: "Insiza",                   province: "Matabeleland South" },
  { name: "Mangwe",                   province: "Matabeleland South" },
  { name: "Matobo",                   province: "Matabeleland South" },
  { name: "Umzingwane",               province: "Matabeleland South" },
  // Midlands
  { name: "Chirimanzu",               province: "Midlands" },
  { name: "Gokwe North",              province: "Midlands" },
  { name: "Gokwe South",              province: "Midlands" },
  { name: "Mberengwa",                province: "Midlands" },
  { name: "Runde",                    province: "Midlands" },
  { name: "Tongogara",                province: "Midlands" },
  { name: "Vungu",                    province: "Midlands" },
  { name: "Zibangwe",                 province: "Midlands" },
];

export const DISTRICTS_BY_PROVINCE: Record<string, string[]> = ZIMBABWE_DISTRICTS.reduce(
  (acc, d) => {
    (acc[d.province] ??= []).push(d.name);
    return acc;
  },
  {} as Record<string, string[]>,
);

export const DISTRICT_NAMES: string[] = ZIMBABWE_DISTRICTS.map((d) => d.name);
