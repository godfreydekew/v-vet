ZIMBABWE_DISTRICTS = {
    # Cities
    "BUL": "Bulawayo (city)",
    "BUL2": "Bulawayo",
    "HAR": "Harare (city)",
    "HAR2": "Harare",

    # Manicaland
    "BUH": "Buhera",
    "CHI": "Chimanimani",
    "CHI2": "Chipinge",
    "MAK": "Makoni",
    "MUT": "Mutare",
    "MUT2": "Mutasa",
    "NYA": "Nyanga",

    # Mashonaland Central
    "BIN": "Bindura",
    "GUR": "Guruve",
    "MAZ": "Mazowe",
    "MUK": "Mukumbura",
    "MUZ": "Muzarabani",
    "SHA": "Shamva",

    # Mashonaland East
    "CHK": "Chikomba",
    "GOR": "Goromonzi",
    "HWE": "Hwedza",
    "MAR": "Marondera",
    "MUR": "Murehwa",
    "MUT3": "Mutoko",
    "UZU": "Uzumba-Maramba-Pfungwe",

    # Mashonaland West
    "CHE": "Chegutu",
    "KAD": "Kadoma",
    "KAR": "Kariba",
    "MAK2": "Makonde",
    "ZVI": "Zvimba",

    # Masvingo
    "BIK": "Bikita",
    "CHR": "Chiredzi",
    "CHV": "Chivi",
    "GUT": "Gutu",
    "MAS": "Masvingo",
    "MWE": "Mwenezi",
    "ZAK": "Zaka",

    # Matabeleland North
    "BNG": "Binga",
    "BUB": "Bubi",
    "HWA": "Hwange",
    "LUP": "Lupane",
    "NKA": "Nkayi",
    "TSH": "Tsholotsho",
    "UMG": "Umguza",

    # Matabeleland South
    "BEI": "Beitbridge",
    "BLM": "Bulilimamangwe",
    "GWA": "Gwanda",
    "INS": "Insiza",

    # Midlands
    "CHR2": "Chirumhanzu",
    "GKN": "Gokwe North",
    "GKS": "Gokwe South",
    "GWE": "Gweru",
    "KWE": "Kwekwe",
    "MBE": "Mberengwa",
    "SHU": "Shurugwi",
    "ZVS": "Zvishavane",
}

DISTRICT_CODES = {v: k for k, v in ZIMBABWE_DISTRICTS.items()}


_DISTRICT_CODES_LOWER = {v.lower(): k for k, v in ZIMBABWE_DISTRICTS.items()}


def get_district_code(district_name: str) -> str | None:
    """Return the district code for a given name, case-insensitive. Returns None if not found."""
    return _DISTRICT_CODES_LOWER.get(district_name.strip().lower())
