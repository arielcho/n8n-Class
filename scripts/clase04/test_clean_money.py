import re


def clean_money(value):
    if value is None:
        return None

    text = str(value).strip()

    if not re.search(r"\d", text):
        return None

    text = re.sub(r"[^0-9,.-]", "", text)

    if "," in text and "." in text:
        text = text.replace(".", "").replace(",", ".")
    elif "." in text:
        parts = text.split(".")
        if len(parts[-1]) == 3:
            text = "".join(parts)
    elif "," in text:
        parts = text.split(",")
        if len(parts[-1]) == 2:
            text = "".join(parts[:-1]) + "." + parts[-1]
        else:
            text = "".join(parts)

    try:
        return round(float(text), 2)
    except ValueError:
        return None


tests = [
    "Bs. 12.500",
    "Bs. 10.400,00",
    "12.500,00",
    "Bs. 2.100,00",
    "Bs. 18.700,00",
    "Bs. 14.450,00",
    "Bs. 500.000",
    "Bs. 185.000",
    "Saldo final",
    None,
]

for item in tests:
    print(f"{item!r} -> {clean_money(item)}")
