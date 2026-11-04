#!/usr/bin/env python3
"""Generate a small monochrome pixel-art Space Shooter animation for the profile README."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "dist/space-shooter.gif")
OUT.parent.mkdir(parents=True, exist_ok=True)

WIDTH, HEIGHT = 640, 220
frames = []
stars = [((i * 83) % WIDTH, (i * 47) % HEIGHT, 1 + (i % 2)) for i in range(52)]

def draw_ship(draw, cx, cy, scale=3):
    pixels = [
        (0,-9),(0,-8),(-1,-7),(1,-7),(-2,-6),(2,-6),
        (-3,-5),(3,-5),(-4,-4),(4,-4),(-5,-3),(5,-3),
        (-6,-2),(6,-2),(-5,-1),(5,-1),(-4,0),(4,0),
        (-3,1),(3,1),(-2,2),(2,2),(-1,3),(1,3),(0,4)
    ]
    for dx, dy in pixels:
        x, y = int(cx + dx * scale), int(cy + dy * scale)
        draw.rectangle((x, y, x + scale - 1, y + scale - 1), fill="white")
    draw.rectangle(
        (cx - scale, cy - scale, cx + scale, cy + scale),
        fill="#888888"
    )

for frame_no in range(16):
    image = Image.new("RGB", (WIDTH, HEIGHT), "#050505")
    draw = ImageDraw.Draw(image)

    # Moving star field.
    for x0, y0, radius in stars:
        x = (x0 - frame_no * 7) % WIDTH
        shade = "#BBBBBB" if (frame_no + x0) % 3 else "white"
        draw.rectangle((x, y0, x + radius, y0 + radius), fill=shade)

    # Pixel-art enemy formation.
    for row in range(2):
        for col in range(7):
            ex = 80 + col * 72 + ((frame_no * 3 + row * 13) % 18) - 9
            ey = 48 + row * 35
            color = "#DADADA" if (col + row + frame_no // 4) % 2 else "#888888"
            draw.rectangle((ex - 7, ey - 3, ex + 7, ey + 3), fill=color)
            draw.rectangle((ex - 4, ey - 7, ex + 4, ey + 7), fill=color)
            draw.rectangle((ex - 12, ey, ex - 8, ey + 4), fill="white")
            draw.rectangle((ex + 8, ey, ex + 12, ey + 4), fill="white")
            draw.point((ex - 3, ey - 1), fill="#050505")
            draw.point((ex + 3, ey - 1), fill="#050505")

    ship_y = 174 + (frame_no % 4 - 2)
    draw_ship(draw, 320, ship_y)
    flame_height = 8 + (frame_no % 3) * 3
    draw.polygon(
        [(311, ship_y + 13), (329, ship_y + 13), (320, ship_y + 13 + flame_height)],
        fill="#BBBBBB"
    )

    draw.text((22, 10), "RH-FATUR  /  SPACE SHOOTER", fill="white")
    draw.text((WIDTH - 125, 10), "8-BIT ARCADE", fill="#AAAAAA")
    draw.rectangle((18, HEIGHT - 24, WIDTH - 18, HEIGHT - 22), fill="#555555")
    frames.append(image)

frames[0].save(
    OUT,
    save_all=True,
    append_images=frames[1:],
    duration=90,
    loop=0,
    optimize=True
)
print(f"Generated {OUT}")
