def get_value(section, alias, threshold=80):
    item = (section or {}).get(alias)

    if isinstance(item, dict):
        if float(item.get("confidence") or 0) < threshold:
            return None
        return item.get("value")

    return item


employment = {
    "employee_name": {"value": "JAIME RONNY RIVERA ROJAS", "confidence": 88},
    "employer_name": {"value": "Tecnologias Integrales del Sur S.R.L", "confidence": 49},
    "declared_salary": {"value": "Bs. 12.500", "confidence": 50},
}

for field in ["employee_name", "employer_name", "declared_salary"]:
    print(f"{field} -> {get_value(employment, field)}")
