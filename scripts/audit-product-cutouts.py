#!/usr/bin/env python3
"""Fail when a storefront product image is corrupt or a cutout can crop/float."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, UnidentifiedImageError


ROOT = Path(__file__).resolve().parents[1]
PRODUCT_ROOT = ROOT / "public/images/products"
CUTOUT_ROOT = PRODUCT_ROOT / "cutouts"
EXPECTED_CANVAS = (1400, 1400)
EXPECTED_FLOOR_Y = 980
MAX_WIDTH = 1060
MAX_HEIGHT = 780
TOLERANCE = 2
FAMILY_SIZE_TOLERANCE = 0.05
MAX_CENTER_OFFSET = 3
MIN_TRANSPARENT_FRACTION = 0.55
MAX_CORNER_ALPHA = 4


def validate_webp_payloads(failures: list[str]) -> None:
    """A .webp filename must contain an actual decodable WebP payload."""
    for path in sorted(PRODUCT_ROOT.rglob("*.webp")):
        if path.name.endswith(".tmp.webp"):
            continue
        label = path.relative_to(ROOT)
        try:
            with Image.open(path) as image:
                image.verify()
                if image.format != "WEBP":
                    failures.append(
                        f"{label}: extension=.webp but payload={image.format or 'unknown'}",
                    )
        except (UnidentifiedImageError, OSError, ValueError) as error:
            failures.append(f"{label}: invalid WebP payload ({error})")


def open_rgba(path: Path, failures: list[str]) -> Image.Image | None:
    try:
        with Image.open(path) as image:
            if image.format != "WEBP":
                return None
            return image.convert("RGBA")
    except (UnidentifiedImageError, OSError, ValueError):
        # validate_webp_payloads already emits the actionable payload failure.
        return None


def main() -> None:
    failures: list[str] = []
    validate_webp_payloads(failures)

    files = [
        path
        for path in sorted(CUTOUT_ROOT.rglob("*.webp"))
        if not path.name.endswith(".tmp.webp")
    ]

    for path in files:
        image = open_rgba(path, failures)
        if image is None:
            continue

        if image.size != EXPECTED_CANVAS:
            failures.append(f"{path.relative_to(ROOT)}: canvas={image.size}")
            continue

        raw_alpha = image.getchannel("A")
        alpha_histogram = raw_alpha.histogram()
        transparent_fraction = alpha_histogram[0] / (image.width * image.height)
        if transparent_fraction < MIN_TRANSPARENT_FRACTION:
            failures.append(
                f"{path.relative_to(ROOT)}: transparent canvas="
                f"{transparent_fraction:.1%}, possible baked backdrop",
            )

        corners = (
            raw_alpha.getpixel((0, 0)),
            raw_alpha.getpixel((image.width - 1, 0)),
            raw_alpha.getpixel((0, image.height - 1)),
            raw_alpha.getpixel((image.width - 1, image.height - 1)),
        )
        if max(corners) > MAX_CORNER_ALPHA:
            failures.append(
                f"{path.relative_to(ROOT)}: non-transparent canvas corner {corners}",
            )

        alpha = raw_alpha.point(lambda value: 255 if value >= 12 else 0)
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
        center_x = (left + right) / 2
        if abs(center_x - EXPECTED_CANVAS[0] / 2) > MAX_CENTER_OFFSET:
            failures.append(f"{label}: horizontal center={center_x:.1f}")

    eptq = [
        CUTOUT_ROOT / "eptq/eptq-s100.webp",
        CUTOUT_ROOT / "eptq/eptq-s300.webp",
        CUTOUT_ROOT / "eptq/eptq-s500.webp",
    ]
    eptq_sizes: list[tuple[int, int]] = []
    for path in eptq:
        image = open_rgba(path, failures)
        if image is None:
            continue
        bbox = image.getchannel("A").point(
            lambda value: 255 if value >= 12 else 0,
        ).getbbox()
        if bbox and (bbox[2] - bbox[0]) <= (bbox[3] - bbox[1]):
            failures.append(f"{path.relative_to(ROOT)}: EPTQ variant is not landscape")
        if bbox:
            eptq_sizes.append((bbox[2] - bbox[0], bbox[3] - bbox[1]))

    if len(eptq_sizes) == len(eptq):
        widths = [width for width, _ in eptq_sizes]
        heights = [height for _, height in eptq_sizes]
        if (max(widths) - min(widths)) / max(widths) > FAMILY_SIZE_TOLERANCE:
            failures.append(f"EPTQ widths are inconsistent: {widths}")
        if (max(heights) - min(heights)) / max(heights) > FAMILY_SIZE_TOLERANCE:
            failures.append(f"EPTQ heights are inconsistent: {heights}")

    neuramis_ten_pack_sizes: list[tuple[int, int]] = []
    for relative in (
        "neuramis-deep-10-pack.webp",
        "neuramis-lido-10-pack.webp",
    ):
        path = CUTOUT_ROOT / relative
        if not path.exists():
            failures.append(f"{path.relative_to(ROOT)}: required storefront cutout is missing")
            continue
        image = open_rgba(path, failures)
        if image is None:
            continue
        bbox = image.getchannel("A").point(
            lambda value: 255 if value >= 12 else 0,
        ).getbbox()
        if bbox:
            neuramis_ten_pack_sizes.append(
                (bbox[2] - bbox[0], bbox[3] - bbox[1]),
            )

    if len(neuramis_ten_pack_sizes) == 2:
        for dimension, values in (
            ("widths", [size[0] for size in neuramis_ten_pack_sizes]),
            ("heights", [size[1] for size in neuramis_ten_pack_sizes]),
        ):
            if (max(values) - min(values)) / max(values) > FAMILY_SIZE_TOLERANCE:
                failures.append(f"Neuramis 10-pack {dimension} are inconsistent: {values}")

    rabianca = CUTOUT_ROOT / "rabianca-70ml.webp"
    if not rabianca.exists():
        failures.append(f"{rabianca.relative_to(ROOT)}: required storefront cutout is missing")
    else:
        image = open_rgba(rabianca, failures)
        if image is not None:
            bbox = image.getchannel("A").point(
                lambda value: 255 if value >= 12 else 0,
            ).getbbox()
            if bbox and (bbox[3] - bbox[1]) <= (bbox[2] - bbox[0]):
                failures.append(f"{rabianca.relative_to(ROOT)}: vial is not upright")

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
