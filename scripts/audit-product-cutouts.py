#!/usr/bin/env python3
"""Fail when a storefront cutout can crop, float or miss the shared floor."""

from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CUTOUT_ROOT = ROOT / "public/images/products/cutouts"
EXPECTED_CANVAS = (1400, 1400)
EXPECTED_FLOOR_Y = 980
MAX_WIDTH = 1060
MAX_HEIGHT = 780
TOLERANCE = 2


def main() -> None:
    failures: list[str] = []
    files = [
        path
        for path in sorted(CUTOUT_ROOT.rglob("*.webp"))
        if not path.name.endswith(".tmp.webp")
    ]

    for path in files:
        with Image.open(path).convert("RGBA") as image:
            if image.size != EXPECTED_CANVAS:
                failures.append(f"{path.relative_to(ROOT)}: canvas={image.size}")
                continue

            alpha = image.getchannel("A").point(lambda value: 255 if value >= 12 else 0)
            bbox = alpha.getbbox()
            if not bbox:
                failures.append(f"{path.relative_to(ROOT)}: empty alpha")
                continue

            left, top, right, bottom = bbox
            width = right - left
            height = bottom - top
            label = path.relative_to(ROOT)

            if abs(bottom - EXPECTED_FLOOR_Y) > TOLERANCE:
                failures.append(f"{label}: floor={bottom}, expected={EXPECTED_FLOOR_Y}")
            if width > MAX_WIDTH + TOLERANCE or height > MAX_HEIGHT + TOLERANCE:
                failures.append(f"{label}: content={width}x{height}")
            if min(left, top, EXPECTED_CANVAS[0] - right) < 12:
                failures.append(f"{label}: unsafe canvas margin bbox={bbox}")

    eptq = [
        CUTOUT_ROOT / "eptq/eptq-s100.webp",
        CUTOUT_ROOT / "eptq/eptq-s300.webp",
        CUTOUT_ROOT / "eptq/eptq-s500.webp",
    ]
    for path in eptq:
        with Image.open(path).convert("RGBA") as image:
            bbox = image.getchannel("A").point(
                lambda value: 255 if value >= 12 else 0,
            ).getbbox()
            if bbox and (bbox[2] - bbox[0]) <= (bbox[3] - bbox[1]):
                failures.append(f"{path.relative_to(ROOT)}: EPTQ variant is not landscape")

    if failures:
        print("Product image audit failed:")
        print("\n".join(f"- {failure}" for failure in failures))
        raise SystemExit(1)

    print(
        f"Product image audit passed: {len(files)} cutouts, "
        f"floor={EXPECTED_FLOOR_Y}/{EXPECTED_CANVAS[1]}",
    )


if __name__ == "__main__":
    main()
