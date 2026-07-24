export interface District {
  name: string;
  province: string;
}

export const ZIMBABWE_DISTRICTS: District[] = [
  // Bulawayo
  { name: "Bulawayo",                 province: "Bulawayo" },
  // Harare
  { name: "Chitungwiza",              province: "Harare" },
  { name: "Epworth",                  province: "Harare" },
  { name: "Harare",                   province: "Harare" },
  { name: "Harare Rural",             province: "Harare" },
  // Manicaland
  { name: "Buhera",                   province: "Manicaland" },
  { name: "Chimanimani",              province: "Manicaland" },
  { name: "Chipinge",                 province: "Manicaland" },
  { name: "Makoni",                   province: "Manicaland" },
  { name: "Mutare",                   province: "Manicaland" },
  { name: "Mutare Rural",             province: "Manicaland" },
  { name: "Mutasa",                   province: "Manicaland" },
  { name: "Nyanga",                   province: "Manicaland" },
  { name: "Rusape",                   province: "Manicaland" },
  // Mashonaland Central
  { name: "Bindura",                  province: "Mashonaland Central" },
  { name: "Guruve",                   province: "Mashonaland Central" },
  { name: "Mazowe",                   province: "Mashonaland Central" },
  { name: "Mbire",                    province: "Mashonaland Central" },
  { name: "Mount Darwin",             province: "Mashonaland Central" },
  { name: "Muzarabani",               province: "Mashonaland Central" },
  { name: "Mvurwi",                   province: "Mashonaland Central" },
  { name: "Rushinga",                 province: "Mashonaland Central" },
  { name: "Shamva",                   province: "Mashonaland Central" },
  // Mashonaland East
  { name: "Chikomba",                 province: "Mashonaland East" },
  { name: "Goromonzi",                province: "Mashonaland East" },
  { name: "Hwedza",                   province: "Mashonaland East" },
  { name: "Marondera",                province: "Mashonaland East" },
  { name: "Marondera Rural",          province: "Mashonaland East" },
  { name: "Mudzi",                    province: "Mashonaland East" },
  { name: "Murehwa",                  province: "Mashonaland East" },
  { name: "Mutoko",                   province: "Mashonaland East" },
  { name: "Ruwa",                     province: "Mashonaland East" },
  { name: "Seke",                     province: "Mashonaland East" },
  { name: "Uzumba-Maramba-Pfungwe",   province: "Mashonaland East" },
  { name: "Wedza",                    province: "Mashonaland East" },
  // Mashonaland West
  { name: "Chegutu",                  province: "Mashonaland West" },
  { name: "Chinhoyi",                 province: "Mashonaland West" },
  { name: "Hurungwe",                 province: "Mashonaland West" },
  { name: "Kadoma",                   province: "Mashonaland West" },
  { name: "Kadoma Urban",             province: "Mashonaland West" },
  { name: "Kariba",                   province: "Mashonaland West" },
  { name: "Kariba Rural",             province: "Mashonaland West" },
  { name: "Kariba Urban",             province: "Mashonaland West" },
  { name: "Karoi",                    province: "Mashonaland West" },
  { name: "Makonde",                  province: "Mashonaland West" },
  { name: "Mhondoro-Ngezi",           province: "Mashonaland West" },
  { name: "Norton",                   province: "Mashonaland West" },
  { name: "Sanyati",                  province: "Mashonaland West" },
  { name: "Zvimba",                   province: "Mashonaland West" },
  // Masvingo
  { name: "Bikita",                   province: "Masvingo" },
  { name: "Chiredzi",                 province: "Masvingo" },
  { name: "Chivi",                    province: "Masvingo" },
  { name: "Gutu",                     province: "Masvingo" },
  { name: "Masvingo",                 province: "Masvingo" },
  { name: "Masvingo Rural",           province: "Masvingo" },
  { name: "Masvingo Urban",           province: "Masvingo" },
  { name: "Mwenezi",                  province: "Masvingo" },
  { name: "Zaka",                     province: "Masvingo" },
  // Matabeleland North
  { name: "Binga",                    province: "Matabeleland North" },
  { name: "Bubi",                     province: "Matabeleland North" },
  { name: "Hwange",                   province: "Matabeleland North" },
  { name: "Hwange Rural",             province: "Matabeleland North" },
  { name: "Hwange Urban",             province: "Matabeleland North" },
  { name: "Lupane",                   province: "Matabeleland North" },
  { name: "Nkayi",                    province: "Matabeleland North" },
  { name: "Tsholotsho",               province: "Matabeleland North" },
  { name: "Umguza",                   province: "Matabeleland North" },
  { name: "Victoria Falls",           province: "Matabeleland North" },
  // Matabeleland South
  { name: "Beitbridge",               province: "Matabeleland South" },
  { name: "Bulilima",                 province: "Matabeleland South" },
  { name: "Gwanda",                   province: "Matabeleland South" },
  { name: "Gwanda Rural",             province: "Matabeleland South" },
  { name: "Gwanda Urban",             province: "Matabeleland South" },
  { name: "Insiza",                   province: "Matabeleland South" },
  { name: "Mangwe",                   province: "Matabeleland South" },
  { name: "Mangwe Rural",             province: "Matabeleland South" },
  { name: "Mangwe Urban",             province: "Matabeleland South" },
  { name: "Matobo",                   province: "Matabeleland South" },
  { name: "Umzingwane",               province: "Matabeleland South" },
  // Midlands
  { name: "Chirumhanzu",              province: "Midlands" },
  { name: "Gokwe",                    province: "Midlands" },
  { name: "Gokwe Centre",             province: "Midlands" },
  { name: "Gokwe North",              province: "Midlands" },
  { name: "Gokwe South",              province: "Midlands" },
  { name: "Gokwe Urban",              province: "Midlands" },
  { name: "Gweru",                    province: "Midlands" },
  { name: "Gweru Rural",              province: "Midlands" },
  { name: "Gweru Urban",              province: "Midlands" },
  { name: "Kwekwe",                   province: "Midlands" },
  { name: "Kwekwe Rural",             province: "Midlands" },
  { name: "Kwekwe Urban",             province: "Midlands" },
  { name: "Mberengwa",                province: "Midlands" },
  { name: "Redcliff",                 province: "Midlands" },
  { name: "Shurugwi",                 province: "Midlands" },
  { name: "Shurugwi Rural",           province: "Midlands" },
  { name: "Shurugwi Urban",           province: "Midlands" },
  { name: "Zvishavane",               province: "Midlands" },
  { name: "Zvishavane Rural",         province: "Midlands" },
  { name: "Zvishavane Urban",         province: "Midlands" },
];

export const DISTRICTS_BY_PROVINCE: Record<string, string[]> = ZIMBABWE_DISTRICTS.reduce(
  (acc, d) => {
    (acc[d.province] ??= []).push(d.name);
    return acc;
  },
  {} as Record<string, string[]>,
);

export const DISTRICT_NAMES: string[] = ZIMBABWE_DISTRICTS.map((d) => d.name);
