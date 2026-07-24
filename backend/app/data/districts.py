ZIMBABWE_DISTRICTS: dict[str, dict] = {
    # Bulawayo
    "Bulawayo": {"code": "BUL", "province": "Bulawayo"},

    # Harare
    "Chitungwiza":  {"code": "CHI", "province": "Harare"},
    "Epworth":      {"code": "EPW", "province": "Harare"},
    "Harare":       {"code": "HAR", "province": "Harare"},
    "Harare Rural": {"code": "HRA", "province": "Harare"},

    # Manicaland
    "Buhera":       {"code": "BUH", "province": "Manicaland"},
    "Chimanimani":  {"code": "CHA", "province": "Manicaland"},
    "Chipinge":     {"code": "CHP", "province": "Manicaland"},
    "Makoni":       {"code": "MAK", "province": "Manicaland"},
    "Mutare":       {"code": "MUT", "province": "Manicaland"},
    "Mutare Rural": {"code": "MUR", "province": "Manicaland"},
    "Mutasa":       {"code": "MUB", "province": "Manicaland"},
    "Nyanga":       {"code": "NYA", "province": "Manicaland"},
    "Rusape":       {"code": "RUS", "province": "Manicaland"},

    # Mashonaland Central
    "Bindura":      {"code": "BIN", "province": "Mashonaland Central"},
    "Guruve":       {"code": "GUR", "province": "Mashonaland Central"},
    "Mazowe":       {"code": "MAZ", "province": "Mashonaland Central"},
    "Mbire":        {"code": "MBI", "province": "Mashonaland Central"},
    "Mount Darwin": {"code": "MOU", "province": "Mashonaland Central"},
    "Muzarabani":   {"code": "MUZ", "province": "Mashonaland Central"},
    "Mvurwi":       {"code": "MVU", "province": "Mashonaland Central"},
    "Rushinga":     {"code": "RUH", "province": "Mashonaland Central"},
    "Shamva":       {"code": "SHA", "province": "Mashonaland Central"},

    # Mashonaland East
    "Chikomba":               {"code": "CHK",  "province": "Mashonaland East"},
    "Goromonzi":              {"code": "GOR",  "province": "Mashonaland East"},
    "Hwedza":                 {"code": "HWE",  "province": "Mashonaland East"},
    "Marondera":              {"code": "MAR",  "province": "Mashonaland East"},
    "Marondera Rural":        {"code": "MRA",  "province": "Mashonaland East"},
    "Mudzi":                  {"code": "MUD",  "province": "Mashonaland East"},
    "Murehwa":                {"code": "MUA",  "province": "Mashonaland East"},
    "Mutoko":                 {"code": "MUO",  "province": "Mashonaland East"},
    "Ruwa":                   {"code": "RUW",  "province": "Mashonaland East"},
    "Seke":                   {"code": "SEK",  "province": "Mashonaland East"},
    "Uzumba-Maramba-Pfungwe": {"code": "UZUM", "province": "Mashonaland East"},
    "Wedza":                  {"code": "WED",  "province": "Mashonaland East"},

    # Mashonaland West
    "Chegutu":        {"code": "CHE", "province": "Mashonaland West"},
    "Chinhoyi":       {"code": "CHN", "province": "Mashonaland West"},
    "Hurungwe":       {"code": "HUR", "province": "Mashonaland West"},
    "Kadoma":         {"code": "KAD", "province": "Mashonaland West"},
    "Kadoma Urban":   {"code": "KAU", "province": "Mashonaland West"},
    "Kariba":         {"code": "KAR", "province": "Mashonaland West"},
    "Kariba Rural":   {"code": "KRA", "province": "Mashonaland West"},
    "Kariba Urban":   {"code": "KUA", "province": "Mashonaland West"},
    "Karoi":          {"code": "KAO", "province": "Mashonaland West"},
    "Makonde":        {"code": "MKN", "province": "Mashonaland West"},
    "Mhondoro-Ngezi": {"code": "MHO", "province": "Mashonaland West"},
    "Norton":         {"code": "NOR", "province": "Mashonaland West"},
    "Sanyati":        {"code": "SAN", "province": "Mashonaland West"},
    "Zvimba":         {"code": "ZVI", "province": "Mashonaland West"},

    # Masvingo
    "Bikita":         {"code": "BIK", "province": "Masvingo"},
    "Chiredzi":       {"code": "CHR", "province": "Masvingo"},
    "Chivi":          {"code": "CHV", "province": "Masvingo"},
    "Gutu":           {"code": "GUT", "province": "Masvingo"},
    "Masvingo":       {"code": "MAS", "province": "Masvingo"},
    "Masvingo Rural": {"code": "MSR", "province": "Masvingo"},
    "Masvingo Urban": {"code": "MSU", "province": "Masvingo"},
    "Mwenezi":        {"code": "MWE", "province": "Masvingo"},
    "Zaka":           {"code": "ZAK", "province": "Masvingo"},

    # Matabeleland North
    "Binga":          {"code": "BIA", "province": "Matabeleland North"},
    "Bubi":           {"code": "BUB", "province": "Matabeleland North"},
    "Hwange":         {"code": "HWA", "province": "Matabeleland North"},
    "Hwange Rural":   {"code": "HWR", "province": "Matabeleland North"},
    "Hwange Urban":   {"code": "HWU", "province": "Matabeleland North"},
    "Lupane":         {"code": "LUP", "province": "Matabeleland North"},
    "Nkayi":          {"code": "NKA", "province": "Matabeleland North"},
    "Tsholotsho":     {"code": "TSH", "province": "Matabeleland North"},
    "Umguza":         {"code": "UMG", "province": "Matabeleland North"},
    "Victoria Falls": {"code": "VIC", "province": "Matabeleland North"},

    # Matabeleland South
    "Beitbridge":   {"code": "BEI", "province": "Matabeleland South"},
    "Bulilima":     {"code": "BUA", "province": "Matabeleland South"},
    "Gwanda":       {"code": "GWA", "province": "Matabeleland South"},
    "Gwanda Rural": {"code": "GWR", "province": "Matabeleland South"},
    "Gwanda Urban": {"code": "GWU", "province": "Matabeleland South"},
    "Insiza":       {"code": "INS", "province": "Matabeleland South"},
    "Mangwe":       {"code": "MAN", "province": "Matabeleland South"},
    "Mangwe Rural": {"code": "MGR", "province": "Matabeleland South"},
    "Mangwe Urban": {"code": "MGU", "province": "Matabeleland South"},
    "Matobo":       {"code": "MAT", "province": "Matabeleland South"},
    "Umzingwane":   {"code": "UMZ", "province": "Matabeleland South"},

    # Midlands
    "Chirumhanzu":      {"code": "CHU", "province": "Midlands"},
    "Gokwe":            {"code": "GOK", "province": "Midlands"},
    "Gokwe Centre":     {"code": "GOC", "province": "Midlands"},
    "Gokwe North":      {"code": "GON", "province": "Midlands"},
    "Gokwe South":      {"code": "GOS", "province": "Midlands"},
    "Gokwe Urban":      {"code": "GOU", "province": "Midlands"},
    "Gweru":            {"code": "GWE", "province": "Midlands"},
    "Gweru Rural":      {"code": "GWB", "province": "Midlands"},
    "Gweru Urban":      {"code": "GWC", "province": "Midlands"},
    "Kwekwe":           {"code": "KWE", "province": "Midlands"},
    "Kwekwe Rural":     {"code": "KWR", "province": "Midlands"},
    "Kwekwe Urban":     {"code": "KWU", "province": "Midlands"},
    "Mberengwa":        {"code": "MBE", "province": "Midlands"},
    "Redcliff":         {"code": "RED", "province": "Midlands"},
    "Shurugwi":         {"code": "SHU", "province": "Midlands"},
    "Shurugwi Rural":   {"code": "SHR", "province": "Midlands"},
    "Shurugwi Urban":   {"code": "SHW", "province": "Midlands"},
    "Zvishavane":       {"code": "ZVS", "province": "Midlands"},
    "Zvishavane Rural": {"code": "ZVR", "province": "Midlands"},
    "Zvishavane Urban": {"code": "ZVU", "province": "Midlands"},
}

_LOWER_INDEX: dict[str, dict] = {k.lower(): v for k, v in ZIMBABWE_DISTRICTS.items()}


def get_district_code(district_name: str) -> str | None:
    """Return the district code for a given name, case-insensitive."""
    entry = _LOWER_INDEX.get(district_name.strip().lower())
    return entry["code"] if entry else None


def get_district_info(district_name: str) -> dict | None:
    """Return the full district dict (code, province) for a given name."""
    return _LOWER_INDEX.get(district_name.strip().lower())
