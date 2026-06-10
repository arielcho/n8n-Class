import re


def clean_bool(value):
    if value is None:
        return None

    text = str(value).strip().lower()

    if text in ["no", "false", "falso"]:
        return False

    if any(phrase in text for phrase in ["sin mora", "sin atraso", "no registra mora"]):
        return False

    if text in ["si", "yes", "true", "verdadero"]:
        return True

    if any(word in text for word in ["mora", "vencido", "atraso", "default"]):
        return True

    return None


def clean_months(value):
    if value is None:
        return None

    text = str(value).lower()

    match = re.search(r"\((\d+)\s*mes", text)
    if match:
        return int(match.group(1))

    years = re.search(r"(\d+)\s*(anos|anios|years)", text)
    if years:
        return int(years.group(1)) * 12

    months = re.search(r"(\d+)\s*(mes|meses|months)", text)
    if months:
        return int(months.group(1))

    return None


print("clean_bool")
for item in ["No", "Si", "Tiene mora", "Sin mora", None]:
    print(f"{item!r} -> {clean_bool(item)}")

print("\nclean_months")
for item in ["20 anos (240 meses)", "5 anos", "18 meses", None]:
    print(f"{item!r} -> {clean_months(item)}")
