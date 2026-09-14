import json, random
random.seed(42)

SIDO = ["서울","부산","대구","인천","광주","대전","울산","세종","경기","강원","충북","충남","전북","전남","경북","경남","제주"]
YEARS = list(range(2008, 2025))

# indicator: (national start, national end, direction noise, sido spread, unit, higher_is_bad)
INDICATORS = {
    "현재흡연율":        dict(s=26.0, e=17.0, spread=3.5, unit="%", bad=True),
    "고위험음주율":      dict(s=18.5, e=12.5, spread=2.8, unit="%", bad=True),
    "걷기실천율":        dict(s=40.0, e=47.5, spread=8.0, unit="%", bad=False),
    "비만율(자가보고)":  dict(s=21.5, e=33.5, spread=4.0, unit="%", bad=True),
    "우울감경험률":      dict(s=5.0,  e=7.8,  spread=1.6, unit="%", bad=True),
}

def gen():
    data = {}
    for name, p in INDICATORS.items():
        n = len(YEARS)
        base = []
        for i, y in enumerate(YEARS):
            t = i / (n - 1)
            v = p["s"] + (p["e"] - p["s"]) * t + random.uniform(-0.6, 0.6)
            base.append(v)
        sido_off = {s: random.uniform(-1, 1) * p["spread"] for s in SIDO}
        # make some regions systematically better/worse
        series = {}
        for s in SIDO:
            vals = []
            drift = random.uniform(-0.04, 0.04)
            for i, b in enumerate(base):
                v = b + sido_off[s] + drift * i + random.uniform(-0.9, 0.9)
                vals.append(round(max(0.5, v), 1))
            series[s] = vals
        # national = median of sido
        nat = []
        for i in range(n):
            col = sorted(series[s][i] for s in SIDO)
            nat.append(round(col[len(col)//2], 1))
        data[name] = dict(unit=p["unit"], bad=p["bad"], national=nat, sido=series)
    return dict(years=YEARS, sido=SIDO, indicators=data)

with open("data.json", "w", encoding="utf-8") as f:
    json.dump(gen(), f, ensure_ascii=False)
print("ok", end="")
