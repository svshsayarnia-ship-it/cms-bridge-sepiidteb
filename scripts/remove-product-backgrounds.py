#!/usr/bin/env python3
"""Create normalized, transparent product cutouts from approved catalog art.

The script is intentionally non-destructive: source photography stays in place
and storefront-ready alpha WebP files are written under
public/images/products/cutouts/.  It requires ``rembg`` with the
``birefnet-general-lite`` model available in ``U2NET_HOME``.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from scipy import ndimage


ROOT = Path(__file__).resolve().parents[1]
PRODUCT_ROOT = ROOT / "public/images/products"
CUTOUT_ROOT = PRODUCT_ROOT / "cutouts"
DRIVE_ROOT = ROOT / "public/images/drive"
CANVAS_SIZE = 1400
CONTENT_MAX_WIDTH = 1060
CONTENT_MAX_HEIGHT = 780
# Every cutout uses the same virtual floor.  Category CSS moves that floor to
# the top of the photographed pedestal, which keeps bottles, boxes and syringes
# aligned without distorting their native proportions.
CONTENT_FLOOR_Y = 980
MAIN_COMPONENT_ONLY = {
    "nabota-150",
    "mesolike-hair",
    "f-vitamin-c",
    # S100 and S300 use a clean pack-only photograph.  Keeping the S500 box as
    # the main component gives the whole variant family the same visual grammar.
    "eptq-s500",
    "eptq-1ml",
}
LANDSCAPE_IF_PORTRAIT = {"eptq-s500", "eptq-1ml"}
EPTQ_PACK_ONLY = {"eptq-s500", "eptq-1ml"}


def source_files() -> list[Path]:
    product_files = [
        path
        for path in PRODUCT_ROOT.rglob("*")
        if path.suffix.lower() in {".webp", ".png", ".jpg", ".jpeg"}
        and CUTOUT_ROOT not in path.parents
        and "editorial" not in path.parts
    ]
    drive_product_files = [
        path
        for path in DRIVE_ROOT.glob("product-*")
        if path.suffix.lower() in {".webp", ".png", ".jpg", ".jpeg"}
    ]
    return sorted(product_files + drive_product_files)


def destination_for(source: Path) -> Path:
    if DRIVE_ROOT in source.parents:
        relative = Path("drive") / source.name
    else:
        relative = source.relative_to(PRODUCT_ROOT)
    return (CUTOUT_ROOT / relative).with_suffix(".webp")


def filter_related_components(image: Image.Image) -> Image.Image:
    """Discard remote watermarks and isolated matte noise around the pack."""
    image = image.convert("RGBA")
    alpha = np.asarray(image.getchannel("A"))
    labels, count = ndimage.label(alpha >= 18)
    if count <= 1:
        return image

    objects = ndimage.find_objects(labels)
    areas = np.bincount(labels.ravel())
    areas[0] = 0
    main_label = int(areas.argmax())
    main_slice = objects[main_label - 1]
    if main_slice is None:
        return image

    y_slice, x_slice = main_slice
    main_width = x_slice.stop - x_slice.start
    main_height = y_slice.stop - y_slice.start
    padding = max(48, round(max(main_width, main_height) * 0.42))
    expanded = (
        max(0, x_slice.start - padding),
        max(0, y_slice.start - padding),
        min(image.width, x_slice.stop + padding),
        min(image.height, y_slice.stop + padding),
    )
    min_area = max(90, round(areas[main_label] * 0.004))

    keep_labels: list[int] = []
    for label_id in range(1, count + 1):
        component_slice = objects[label_id - 1]
        if component_slice is None or areas[label_id] < min_area:
            continue
        ys, xs = component_slice
        intersects = not (
            xs.stop < expanded[0]
            or xs.start > expanded[2]
            or ys.stop < expanded[1]
            or ys.start > expanded[3]
        )
        if intersects or areas[label_id] >= areas[main_label] * 0.28:
            keep_labels.append(label_id)

    clean_alpha = np.where(np.isin(labels, keep_labels), alpha, 0).astype(np.uint8)
    image.putalpha(Image.fromarray(clean_alpha, mode="L"))
    return image


def keep_largest_component(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    alpha = np.asarray(image.getchannel("A"))
    labels, count = ndimage.label(alpha >= 18)
    if count <= 1:
        return image
    areas = np.bincount(labels.ravel())
    areas[0] = 0
    clean_alpha = np.where(labels == int(areas.argmax()), alpha, 0).astype(np.uint8)
    image.putalpha(Image.fromarray(clean_alpha, mode="L"))
    return image


def keep_eptq_pack_only(cutout: Image.Image) -> Image.Image:
    """Remove the separate S500 syringe while preserving the complete box.

    The approved S500 reference is a portrait arrangement.  Once rotated, the
    pack occupies the full-width upper band and the syringe sits in a much
    narrower lower band.  Detecting that width break is safer than a fixed crop
    and remains idempotent after the pack-only result has been generated.
    """
    if cutout.width / max(cutout.height, 1) >= 2:
        return cutout

    alpha = np.asarray(cutout.getchannel("A")) >= 18
    row_coverage = alpha.sum(axis=1)
    peak = int(row_coverage.max(initial=0))
    if peak == 0:
        return cutout

    narrow = row_coverage < peak * 0.4
    search_start = round(cutout.height * 0.45)
    run = 8
    cut_y = next(
        (
            y
            for y in range(search_start, cutout.height - run)
            if bool(narrow[y : y + run].all())
        ),
        None,
    )
    if cut_y is None:
        return cutout

    pack = cutout.crop((0, 0, cutout.width, cut_y))
    pack_bbox = pack.getchannel("A").point(
        lambda value: 255 if value >= 12 else 0,
    ).getbbox()
    return pack.crop(pack_bbox) if pack_bbox else cutout


def erase_eptq_syringe_overlap(cutout: Image.Image) -> Image.Image:
    """Clean the two blue handle fragments that overlap the S500 box edge."""
    rgba = np.asarray(cutout.convert("RGBA")).copy()
    red, green, blue, alpha = [rgba[:, :, index] for index in range(4)]
    blue_pixels = (
        (alpha >= 12)
        & (blue >= 80)
        & (blue > red * 1.25)
        & (blue > green * 1.10)
    )
    labels, count = ndimage.label(blue_pixels)
    objects = ndimage.find_objects(labels)
    erase = np.zeros_like(blue_pixels)

    for label_id in range(1, count + 1):
        component = objects[label_id - 1]
        if component is None:
            continue
        ys, _ = component
        if ys.stop >= cutout.height - 1 and ys.start > cutout.height * 0.70:
            erase |= labels == label_id

    if not erase.any():
        return cutout

    erase = ndimage.binary_dilation(erase, iterations=5)
    original_alpha = rgba[:, :, 3].copy()
    for y, x in zip(*np.where(erase)):
        source_y = y - 1
        while source_y >= 0 and erase[source_y, x]:
            source_y -= 1
        if source_y >= 0 and original_alpha[source_y, x] >= 12:
            rgba[y, x, :3] = rgba[source_y, x, :3]
        else:
            rgba[y, x, :3] = (242, 242, 240)
        rgba[y, x, 3] = original_alpha[y, x]

    return Image.fromarray(rgba, mode="RGBA")


def normalize_cutout(
    image: Image.Image,
    *,
    sharpen: bool = True,
    asset_stem: str = "",
) -> Image.Image:
    image = image.convert("RGBA")
    image = filter_related_components(image)
    if asset_stem in MAIN_COMPONENT_ONLY:
        image = keep_largest_component(image)
    alpha = image.getchannel("A")
    # Ignore isolated near-transparent pixels when calculating the product box.
    bbox = alpha.point(lambda value: 255 if value >= 12 else 0).getbbox()
    if not bbox:
        raise ValueError("background removal produced an empty alpha channel")

    cutout = image.crop(bbox)
    if asset_stem in LANDSCAPE_IF_PORTRAIT and cutout.height > cutout.width:
        cutout = cutout.rotate(90, expand=True)
    if asset_stem in EPTQ_PACK_ONLY:
        cutout = keep_eptq_pack_only(cutout)
        cutout = erase_eptq_syringe_overlap(cutout)

    scale = min(
        CONTENT_MAX_WIDTH / cutout.width,
        CONTENT_MAX_HEIGHT / cutout.height,
        4.5,
    )
    target = (
        max(1, round(cutout.width * scale)),
        max(1, round(cutout.height * scale)),
    )
    if target != cutout.size:
        cutout = cutout.resize(target, Image.Resampling.LANCZOS)

    # A restrained sharpening pass restores label legibility after resizing
    # without inventing or redrawing any packaging detail.
    rgb = cutout.convert("RGB")
    if sharpen:
        rgb = ImageEnhance.Sharpness(rgb).enhance(1.08)
        rgb = rgb.filter(ImageFilter.UnsharpMask(radius=0.65, percent=45, threshold=4))
    rgb.putalpha(cutout.getchannel("A"))

    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    x = (CANVAS_SIZE - rgb.width) // 2
    y = CONTENT_FLOOR_Y - rgb.height
    canvas.alpha_composite(rgb, (x, y))
    return canvas


def process(source: Path, destination: Path, session: object) -> None:
    # Imported lazily so the deterministic ``--clean-existing`` normalization
    # can run in CI or a design workstation without downloading the matte model.
    from rembg import remove

    with Image.open(source) as original:
        rgba = original.convert("RGBA")
        if source.stem == "regenfill-lido":
            # The only available market reference is a low-contrast front-on
            # pack. Its pale pink rectangle is the physical box, so preserve
            # that rectangle instead of asking the matte model to erase it.
            top = round(rgba.height * 0.29)
            bottom = round(rgba.height * 0.72)
            extracted = rgba.crop((0, top, rgba.width, bottom))
            extracted.putalpha(Image.new("L", extracted.size, 255))
        else:
            extracted = remove(
                rgba,
                session=session,
                alpha_matting=True,
                alpha_matting_foreground_threshold=240,
                alpha_matting_background_threshold=10,
                alpha_matting_erode_size=5,
                post_process_mask=True,
            )
    normalized = normalize_cutout(extracted, asset_stem=source.stem)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(f"{destination.stem}.tmp.webp")
    normalized.save(
        temporary,
        "WEBP",
        quality=92,
        alpha_quality=100,
        method=6,
        exact=True,
    )
    temporary.replace(destination)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--shard-index", type=int, default=0)
    parser.add_argument("--shard-count", type=int, default=1)
    parser.add_argument("--clean-existing", action="store_true")
    parser.add_argument("--only", action="append", default=[])
    args = parser.parse_args()

    os.environ.setdefault("U2NET_HOME", "/tmp/sepiid-rembg-models")
    if args.clean_existing:
        completed = 0
        destinations = sorted(CUTOUT_ROOT.rglob("*.webp"))
        if args.only:
            requested = set(args.only)
            destinations = [path for path in destinations if path.stem in requested]
        for destination in destinations:
            if destination.name.endswith(".tmp.webp"):
                continue
            with Image.open(destination) as existing:
                normalized = normalize_cutout(
                    existing,
                    sharpen=False,
                    asset_stem=destination.stem,
                )
            temporary = destination.with_name(f"{destination.stem}.tmp.webp")
            normalized.save(
                temporary,
                "WEBP",
                quality=92,
                alpha_quality=100,
                method=6,
                exact=True,
            )
            temporary.replace(destination)
            completed += 1
        print(f"cleaned={completed}", flush=True)
        return

    from rembg import new_session

    session = new_session("birefnet-general-lite")
    files = source_files()
    if args.only:
        requested = set(args.only)
        files = [path for path in files if path.stem in requested]
    if args.shard_count < 1 or not 0 <= args.shard_index < args.shard_count:
        raise SystemExit("shard-index must be within shard-count")
    files = files[args.shard_index :: args.shard_count]
    if args.limit > 0:
        files = files[: args.limit]

    completed = 0
    for source in files:
        destination = destination_for(source)
        if destination.exists() and not args.force:
            continue
        process(source, destination, session)
        completed += 1
        print(f"cutout {completed}: {source.relative_to(ROOT)} -> {destination.relative_to(ROOT)}", flush=True)

    print(f"completed={completed} total_sources={len(files)}", flush=True)


if __name__ == "__main__":
    main()
