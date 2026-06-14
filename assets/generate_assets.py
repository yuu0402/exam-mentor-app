#!/usr/bin/env python3
"""
Generate PNG asset files for zhongkao-mentor app.
Creates icon.png, splash.png, adaptive-icon.png, and favicon.png.
Uses only Python standard library (no PIL required).
"""

import struct
import zlib
import os
import math

def create_png(width, height, pixel_func, filepath):
    """Create a PNG file using only standard library.

    Args:
        width: Image width
        height: Image height
        pixel_func: Function(x, y) returning (r, g, b, a) tuple
        filepath: Output file path
    """
    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xffffffff)
        return struct.pack('>I', len(data)) + c + crc

    # PNG signature
    sig = b'\x89PNG\r\n\x1a\n'

    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr = chunk(b'IHDR', ihdr_data)

    # IDAT - generate raw pixel data
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # filter type: None
        for x in range(width):
            r, g, b, a = pixel_func(x, y)
            raw_data += struct.pack('BBBB', r, g, b, a)

    compressed = zlib.compress(raw_data, 9)
    idat = chunk(b'IDAT', compressed)

    # IEND
    iend = chunk(b'IEND', b'')

    with open(filepath, 'wb') as f:
        f.write(sig + ihdr + idat + iend)

    file_size = os.path.getsize(filepath)
    print(f"  Created: {filepath} ({file_size:,} bytes, {width}x{height})")
    return file_size


def lerp(a, b, t):
    return int(a + (b - a) * t)

def clamp(v, lo=0, hi=255):
    return max(lo, min(hi, v))

def dist(x1, y1, x2, y2):
    return math.sqrt((x2-x1)**2 + (y2-y1)**2)


def draw_rounded_rect(x, y, w, h, radius, px, py):
    """Check if point (px,py) is inside a rounded rectangle."""
    if px < x or px >= x + w or py < y or py >= y + h:
        return False
    # Check corners
    corners = [
        (x + radius, y + radius),
        (x + w - radius, y + radius),
        (x + w - radius, y + h - radius),
        (x + radius, y + h - radius)
    ]
    in_corner = False
    for cx, cy in corners:
        if ((px < x + radius or px >= x + w - radius) and
            (py < y + radius or py >= y + h - radius)):
            if dist(px, py, cx, cy) > radius:
                return False
    return True


def draw_star(cx, cy, spikes, outer_r, inner_r, px, py):
    """Check if point (px,py) is inside a star shape."""
    d = dist(px, py, cx, cy)
    if d > outer_r:
        return False
    angle = math.atan2(py - cy, px - cx) + math.pi / 2
    if angle < 0:
        angle += 2 * math.pi
    spike_angle = (2 * math.pi) / spikes
    angle_in_spike = angle % spike_angle
    half = spike_angle / 2
    if angle_in_spike < half:
        r = outer_r + (inner_r - outer_r) * (angle_in_spike / half)
    else:
        r = inner_r + (outer_r - inner_r) * ((angle_in_spike - half) / half)
    return d <= r


def create_icon_pixel(w, h):
    """Create pixel function for icon (1024x1024)."""
    radius = int(w * 0.22)
    margin = 10

    def pixel(x, y):
        # Background - gradient rounded rect
        if not draw_rounded_rect(margin, margin, w - 2*margin, h - 2*margin, radius, x, y):
            return (0, 0, 0, 0)  # Transparent

        # Gradient background
        t = (y - margin) / (h - 2*margin)
        r = lerp(102, 56, t)   # #66BB6A -> #388E3C
        g = lerp(187, 142, t)
        b = lerp(106, 60, t)

        # Book area
        book_w = int(w * 0.45)
        book_h = int(h * 0.30)
        book_x = (w - book_w) // 2
        book_y = int(h * 0.25)

        if draw_rounded_rect(book_x, book_y, book_w, book_h, 12, x, y):
            return (255, 255, 255, 255)

        # Book spine
        spine_x = book_x + int(book_w * 0.08)
        if book_x <= x <= book_x + book_w and book_y <= y <= book_y + book_h:
            if abs(x - spine_x) < 4:
                return (76, 175, 80, 255)
            # Text lines on book
            for i in range(1, 5):
                line_y = book_y + int(book_h * (0.2 + i * 0.15))
                if abs(y - line_y) < 2 and book_x + int(book_w * 0.15) <= x <= book_x + int(book_w * 0.80):
                    return (165, 214, 167, 255)

        # Stars - gold
        star_x1 = int(w * 0.72)
        star_y1 = int(h * 0.18)
        star_r1 = int(w * 0.12)
        if draw_star(star_x1, star_y1, 5, star_r1, int(star_r1 * 0.45), x, y):
            return (255, 215, 0, 255)

        star_x2 = int(w * 0.25)
        star_y2 = int(h * 0.15)
        star_r2 = int(w * 0.07)
        if draw_star(star_x2, star_y2, 5, star_r2, int(star_r2 * 0.45), x, y):
            return (255, 215, 0, 255)

        # Text area "私人导师" - simplified block text
        text_cx = w // 2
        text_cy = int(h * 0.75)
        # Approximate Chinese characters as rectangles for each character
        char_w = int(w * 0.12)
        char_h = int(h * 0.08)
        chars_positions = [
            (text_cx - int(char_w * 1.65), text_cy),
            (text_cx - int(char_w * 0.55), text_cy),
            (text_cx + int(char_w * 0.55), text_cy),
            (text_cx + int(char_w * 1.65), text_cy),
        ]
        for cx, cy in chars_positions:
            if abs(x - cx) < char_w // 2 and abs(y - cy) < char_h // 2:
                return (255, 255, 255, 255)

        return (r, g, b, 255)

    return pixel


def create_splash_pixel(w, h):
    """Create pixel function for splash (1284x2778)."""
    def pixel(x, y):
        # Vertical gradient
        t = y / h
        if t < 0.5:
            r = lerp(102, 76, t * 2)
            g = lerp(187, 175, t * 2)
            b = lerp(106, 80, t * 2)
        else:
            r = lerp(76, 56, (t - 0.5) * 2)
            g = lerp(175, 142, (t - 0.5) * 2)
            b = lerp(80, 60, (t - 0.5) * 2)

        # Center book
        book_w = int(w * 0.30)
        book_h = int(h * 0.08)
        book_x = (w - book_w) // 2
        book_y = int(h * 0.33)
        if draw_rounded_rect(book_x, book_y, book_w, book_h, 12, x, y):
            return (255, 255, 255, 255)

        # Book spine on splash
        spine_x = book_x + int(book_w * 0.06)
        if book_x <= x <= book_x + book_w and book_y <= y <= book_y + book_h:
            if abs(x - spine_x) < 3:
                return (76, 175, 80, 255)

        # Stars on splash
        if draw_star(int(w * 0.65), int(h * 0.28), 5, int(w * 0.08), int(w * 0.035), x, y):
            return (255, 215, 0, 255)
        if draw_star(int(w * 0.35), int(h * 0.26), 5, int(w * 0.05), int(w * 0.02), x, y):
            return (255, 215, 0, 255)

        # Title "私人导师" area
        title_cx = w // 2
        title_cy = int(h * 0.52)
        char_w = int(w * 0.065)
        char_h = int(h * 0.035)
        for i in range(4):
            cx = title_cx + (i - 1.5) * char_w * 1.2
            if abs(x - cx) < char_w // 2 and abs(y - title_cy) < char_h // 2:
                return (255, 255, 255, 255)

        # Subtitle area
        sub_cy = int(h * 0.58)
        sub_char_w = int(w * 0.025)
        sub_char_h = int(h * 0.012)
        for i in range(7):
            cx = title_cx + (i - 3) * sub_char_w * 1.3
            if abs(x - cx) < sub_char_w // 2 and abs(y - sub_cy) < sub_char_h // 2:
                return (255, 255, 255, 220)

        # Bottom line
        if int(h * 0.88) - 1 <= y <= int(h * 0.88) + 1 and int(w * 0.2) <= x <= int(w * 0.8):
            return (255, 255, 255, 80)

        return (r, g, b, 255)

    return pixel


def create_favicon_pixel(w, h):
    """Create pixel function for favicon (48x48)."""
    radius = int(w * 0.15)

    def pixel(x, y):
        if not draw_rounded_rect(1, 1, w - 2, h - 2, radius, x, y):
            return (0, 0, 0, 0)

        # Green background
        r, g, b = 76, 175, 80

        # Book shape
        bw = int(w * 0.5)
        bh = int(h * 0.35)
        bx = (w - bw) // 2
        by = (h - bh) // 2 - int(h * 0.05)
        if bx <= x <= bx + bw and by <= y <= by + bh:
            return (255, 255, 255, 255)

        # Book spine
        if bx <= x <= bx + int(bw * 0.1) and by <= y <= by + bh:
            return (76, 175, 80, 255)

        # Small star
        if draw_star(int(w * 0.72), int(h * 0.25), 5, int(w * 0.15), int(w * 0.06), x, y):
            return (255, 215, 0, 255)

        return (r, g, b, 255)

    return pixel


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    print("Generating zhongkao-mentor asset files...")
    print(f"Output directory: {script_dir}\n")

    total = 0

    # 1. icon.png - 1024x1024
    print("[1/4] Generating icon.png (1024x1024)...")
    total += create_icon_pixel(1024, 1024).__code__.co_consts  # just for syntax
    create_png(1024, 1024, create_icon_pixel(1024, 1024),
               os.path.join(script_dir, 'icon.png'))

    # 2. splash.png - 1284x2778
    print("[2/4] Generating splash.png (1284x2778)...")
    create_png(1284, 2778, create_splash_pixel(1284, 2778),
               os.path.join(script_dir, 'splash.png'))

    # 3. adaptive-icon.png - 1024x1024
    print("[3/4] Generating adaptive-icon.png (1024x1024)...")
    create_png(1024, 1024, create_icon_pixel(1024, 1024),
               os.path.join(script_dir, 'adaptive-icon.png'))

    # 4. favicon.png - 48x48
    print("[4/4] Generating favicon.png (48x48)...")
    create_png(48, 48, create_favicon_pixel(48, 48),
               os.path.join(script_dir, 'favicon.png'))

    print("\nAll files generated successfully!")
    print("Note: These are programmatically generated images.")
    print("For production, replace with professionally designed assets.")


if __name__ == '__main__':
    main()
