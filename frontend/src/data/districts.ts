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
  { name: "Guruve",                   province: "Mashonaland Central" },
  { name: "Mazowe",                   province: "Mashonaland Central" },
  { name: "Mukumbura",                province: "Mashonaland Central" },
  { name: "Muzarabani",               province: "Mashonaland Central" },
  { name: "Shamva",                   province: "Mashonaland Central" },
  // Mashonaland East
  { name: "Chikomba",                 province: "Mashonaland East" },
  { name: "Goromonzi",                province: "Mashonaland East" },
  { name: "Hwedza",                   province: "Mashonaland East" },
  { name: "Marondera",                province: "Mashonaland East" },
  { name: "Murehwa",                  province: "Mashonaland East" },
  { name: "Mutoko",                   province: "Mashonaland East" },
  { name: "Uzumba-Maramba-Pfungwe",   province: "Mashonaland East" },
  // Mashonaland West
  { name: "Chegutu",                  province: "Mashonaland West" },
  { name: "Kadoma",                   province: "Mashonaland West" },
  { name: "Kariba",                   province: "Mashonaland West" },
  { name: "Makonde",                  province: "Mashonaland West" },
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
  { name: "Lupane",                   province: "Matabeleland North" },
  { name: "Nkayi",                    province: "Matabeleland North" },
  { name: "Tsholotsho",               province: "Matabeleland North" },
  { name: "Umguza",                   province: "Matabeleland North" },
  // Matabeleland South
  { name: "Beitbridge",               province: "Matabeleland South" },
  { name: "Bulilimamangwe",           province: "Matabeleland South" },
  { name: "Gwanda",                   province: "Matabeleland South" },
  { name: "Insiza",                   province: "Matabeleland South" },
  // Midlands
  { name: "Chirumhanzu",              province: "Midlands" },
  { name: "Gokwe North",              province: "Midlands" },
  { name: "Gokwe South",              province: "Midlands" },
  { name: "Gweru",                    province: "Midlands" },
  { name: "Kwekwe",                   province: "Midlands" },
  { name: "Mberengwa",                province: "Midlands" },
  { name: "Shurugwi",                 province: "Midlands" },
  { name: "Zvishavane",               province: "Midlands" },
];

export const DISTRICTS_BY_PROVINCE: Record<string, string[]> = ZIMBABWE_DISTRICTS.reduce(
  (acc, d) => {
    (acc[d.province] ??= []).push(d.name);
    return acc;
  },
  {} as Record<string, string[]>,
);

export const DISTRICT_NAMES: string[] = ZIMBABWE_DISTRICTS.map((d) => d.name);
