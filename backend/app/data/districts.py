ZIMBABWE_DISTRICTS: dict[str, dict] = {
    # Cities
    "Bulawayo": {"code": "BUL", "province": "Bulawayo"},
    "Harare":   {"code": "HAR", "province": "Harare"},

    # Manicaland
    "Buhera":      {"code": "BUH",  "province": "Manicaland"},
    "Chimanimani": {"code": "CHI",  "province": "Manicaland"},
    "Chipinge":    {"code": "CHI2", "province": "Manicaland"},
    "Makoni":      {"code": "MAK",  "province": "Manicaland"},
    "Mutare":      {"code": "MUT",  "province": "Manicaland"},
    "Mutasa":      {"code": "MUT2", "province": "Manicaland"},
    "Nyanga":      {"code": "NYA",  "province": "Manicaland"},

    # Mashonaland Central
    "Bindura":    {"code": "BIN", "province": "Mashonaland Central"},
    "Guruve":     {"code": "GUR", "province": "Mashonaland Central"},
    "Mazowe":     {"code": "MAZ", "province": "Mashonaland Central"},
    "Mukumbura":  {"code": "MUK", "province": "Mashonaland Central"},
    "Muzarabani": {"code": "MUZ", "province": "Mashonaland Central"},
    "Shamva":     {"code": "SHA", "province": "Mashonaland Central"},

    # Mashonaland East
    "Chikomba":                {"code": "CHK",  "province": "Mashonaland East"},
    "Goromonzi":               {"code": "GOR",  "province": "Mashonaland East"},
    "Hwedza":                  {"code": "HWE",  "province": "Mashonaland East"},
    "Marondera":               {"code": "MAR",  "province": "Mashonaland East"},
    "Murehwa":                 {"code": "MUR",  "province": "Mashonaland East"},
    "Mutoko":                  {"code": "MUT3", "province": "Mashonaland East"},
    "Uzumba-Maramba-Pfungwe":  {"code": "UZU",  "province": "Mashonaland East"},

    # Mashonaland West
    "Chegutu": {"code": "CHE",  "province": "Mashonaland West"},
    "Kadoma":  {"code": "KAD",  "province": "Mashonaland West"},
    "Kariba":  {"code": "KAR",  "province": "Mashonaland West"},
    "Makonde": {"code": "MAK2", "province": "Mashonaland West"},
    "Zvimba":  {"code": "ZVI",  "province": "Mashonaland West"},

    # Masvingo
    "Bikita":   {"code": "BIK", "province": "Masvingo"},
    "Chiredzi": {"code": "CHR", "province": "Masvingo"},
    "Chivi":    {"code": "CHV", "province": "Masvingo"},
    "Gutu":     {"code": "GUT", "province": "Masvingo"},
    "Masvingo": {"code": "MAS", "province": "Masvingo"},
    "Mwenezi":  {"code": "MWE", "province": "Masvingo"},
    "Zaka":     {"code": "ZAK", "province": "Masvingo"},

    # Matabeleland North
    "Binga":      {"code": "BNG", "province": "Matabeleland North"},
    "Bubi":       {"code": "BUB", "province": "Matabeleland North"},
    "Hwange":     {"code": "HWA", "province": "Matabeleland North"},
    "Lupane":     {"code": "LUP", "province": "Matabeleland North"},
    "Nkayi":      {"code": "NKA", "province": "Matabeleland North"},
    "Tsholotsho": {"code": "TSH", "province": "Matabeleland North"},
    "Umguza":     {"code": "UMG", "province": "Matabeleland North"},

    # Matabeleland South
    "Beitbridge":       {"code": "BEI", "province": "Matabeleland South"},
    "Bulilimamangwe":   {"code": "BLM", "province": "Matabeleland South"},
    "Gwanda":           {"code": "GWA", "province": "Matabeleland South"},
    "Insiza":           {"code": "INS", "province": "Matabeleland South"},

    # Midlands
    "Chirumhanzu": {"code": "CHR2", "province": "Midlands"},
    "Gokwe North": {"code": "GKN",  "province": "Midlands"},
    "Gokwe South": {"code": "GKS",  "province": "Midlands"},
    "Gweru":       {"code": "GWE",  "province": "Midlands"},
    "Kwekwe":      {"code": "KWE",  "province": "Midlands"},
    "Mberengwa":   {"code": "MBE",  "province": "Midlands"},
    "Shurugwi":    {"code": "SHU",  "province": "Midlands"},
    "Zvishavane":  {"code": "ZVS",  "province": "Midlands"},
}

_LOWER_INDEX: dict[str, dict] = {k.lower(): v for k, v in ZIMBABWE_DISTRICTS.items()}


def get_district_code(district_name: str) -> str | None:
    """Return the district code for a given name, case-insensitive."""
    entry = _LOWER_INDEX.get(district_name.strip().lower())
    return entry["code"] if entry else None


def get_district_info(district_name: str) -> dict | None:
    """Return the full district dict (code, province) for a given name."""
    return _LOWER_INDEX.get(district_name.strip().lower())
