# -*- coding: utf-8 -*-
"""
간이생명표(Chiang) + Sullivan 건강수명 계산 모듈.

- chiang_lifetable(ages, deaths, pop): 구간 시작연령 리스트(마지막은 열린 구간) + 구간별 사망자·인구(연앙, 3년 합산 가능) → 생명표
- sullivan(L, l, unhealthy, x_idx): 정지인구 L_i, 생존자 l, 불건강 비율 π_i → x세 건강기대여명
- implied_unhealthy(L, l, hle_by_idx): 공식 건강기대여명(연령별)에서 구간별 불건강 비율을 역산
- scale_pattern(pattern, ratio): 로짓(오즈) 공간에서 불건강 곡선의 높이만 보정
참고: Chiang CL (1984); Sullivan DF (1971); 통계청 생명표 작성 방법.
"""
from __future__ import annotations
import math


def widths_of(ages: list[int]) -> list[float]:
    return [ages[i + 1] - ages[i] for i in range(len(ages) - 1)] + [math.inf]


def a_frac(age: int, width: float, m0: float | None = None) -> float:
    """구간 내 사망자의 평균 생존 비율 a_i."""
    if age == 0:
        if width <= 1:                       # 0세 단독 구간
            return 0.1 if (m0 is None or m0 >= 0.107) else 0.053 + 2.8 * m0
        return 0.15                          # 0~4세 합산 구간 (영아 사망 비중이 커서 앞쪽으로 쏠림)
    return 0.5


def chiang_lifetable(ages: list[int], deaths: list[float], pop: list[float], radix: float = 100000.0) -> dict:
    assert len(ages) == len(deaths) == len(pop)
    W = widths_of(ages)
    m = [(d / p) if p > 0 else 0.0 for d, p in zip(deaths, pop)]
    q, a = [], []
    for i, (n, mi) in enumerate(zip(W, m)):
        ai = a_frac(ages[i], n, m[0])
        qi = 1.0 if math.isinf(n) else min(max(n * mi / (1 + (1 - ai) * n * mi), 0.0), 1.0)
        q.append(qi); a.append(ai)
    l = [radix]
    for qi in q[:-1]:
        l.append(l[-1] * (1 - qi))
    d = [li * qi for li, qi in zip(l, q)]
    L = []
    for i, n in enumerate(W):
        L.append((l[i] / m[i] if m[i] > 0 else 0.0) if math.isinf(n) else n * (l[i] - d[i]) + a[i] * n * d[i])
    T, acc = [0.0] * len(ages), 0.0
    for i in range(len(ages) - 1, -1, -1):
        acc += L[i]; T[i] = acc
    e = [T[i] / l[i] if l[i] > 0 else 0.0 for i in range(len(ages))]
    return {"ages": ages, "m": m, "q": q, "l": l, "d": d, "L": L, "T": T, "e": e}


def sullivan(L: list[float], l: list[float], unhealthy: list[float], x_idx: int = 0) -> float:
    """HLE_x = Σ_{i≥x} L_i (1 − π_i) / l_x"""
    return sum(Li * (1 - pi) for Li, pi in zip(L[x_idx:], unhealthy[x_idx:])) / l[x_idx]


def implied_unhealthy(L: list[float], l: list[float], hle: list[float | None]) -> list[float]:
    """공식 건강기대여명 HLE_x(구간 시작연령별)와 생명표(L, l)에서 구간별 π_i 역산.
    L_i(1−π_i) = HLE_i·l_i − HLE_{i+1}·l_{i+1}. 값이 없는 구간은 이웃 보간."""
    n = len(L); out = [None] * n
    H = [hle[i] * l[i] if hle[i] is not None else None for i in range(n)]
    for i in range(n):
        nxt = H[i + 1] if i + 1 < n else 0.0
        if H[i] is None or nxt is None or L[i] <= 0:
            continue
        out[i] = min(max(1 - (H[i] - nxt) / L[i], 0.0), 1.0)
    # 결측 보간
    for i in range(n):
        if out[i] is None:
            prev = next((out[k] for k in range(i - 1, -1, -1) if out[k] is not None), None)
            post = next((out[k] for k in range(i + 1, n) if out[k] is not None), None)
            out[i] = prev if post is None else post if prev is None else (prev + post) / 2
    return out


def scale_pattern(pattern: list[float], ratio: float) -> list[float]:
    """불건강 오즈를 ratio 배로 조정(높이 보정, 0~1 유지)."""
    out = []
    for p in pattern:
        p = min(max(p, 1e-6), 1 - 1e-6)
        odds = p / (1 - p) * ratio
        out.append(odds / (1 + odds))
    return out


def regroup(src_ages: list[int], src_vals: list[float], dst_ages: list[int]) -> list[float]:
    """세분 연령 구간 값(합산 가능한 양)을 더 굵은 구간으로 합산. src_ages/dst_ages는 시작연령(오름차순)."""
    out = [0.0] * len(dst_ages)
    for a, v in zip(src_ages, src_vals):
        j = max(k for k in range(len(dst_ages)) if dst_ages[k] <= a)
        out[j] += v
    return out


if __name__ == "__main__":
    ages = [0] + list(range(5, 90, 5))
    m = [0.0006, 0.00008, 0.0001, 0.0003, 0.0004, 0.0005, 0.0006, 0.0009, 0.0014, 0.0022, 0.0034, 0.0053, 0.0083, 0.0134, 0.0228, 0.0404, 0.0749, 0.157]
    lt = chiang_lifetable(ages, [x * 1e6 for x in m], [1e6] * len(ages))
    pi = [0.05, 0.05, 0.05, 0.08, 0.1, 0.12, 0.15, 0.18, 0.22, 0.27, 0.32, 0.38, 0.45, 0.52, 0.58, 0.63, 0.68, 0.72]
    hle = sullivan(lt["L"], lt["l"], pi)
    # 역산 검증: 연령별 HLE_x 를 만든 뒤 π 복원
    hx = [sullivan(lt["L"], lt["l"], pi, i) for i in range(len(ages))]
    back = implied_unhealthy(lt["L"], lt["l"], hx)
    print("e0", round(lt["e"][0], 2), "HLE0", round(hle, 2), "max|π−π̂|", round(max(abs(a - b) for a, b in zip(pi, back)), 6))
