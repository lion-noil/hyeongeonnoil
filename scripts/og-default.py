# 사이트 기본 OG 이미지(public/og-default.png, 1200x630) 생성기. (2026-10-09)
# 사용: py -3 scripts/og-default.py [BoldTTF] [RegularTTF]
#   폰트 미지정 시 Windows 맑은 고딕. 배포 이미지는 Noto Sans KR 서브셋(public/fonts 의 woff 원본 ttf)으로 만들었다.
# 브랜드색은 사이트와 동일: 배경 #04060f, 하늘 #00bfff, 민트 #00ffcc.
import sys, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1200, 630
BG = (4, 6, 15)
SKY = (0, 191, 255)
MINT = (0, 255, 204)
bold = sys.argv[1] if len(sys.argv) > 1 else r"C:\Windows\Fonts\malgunbd.ttf"
regular = sys.argv[2] if len(sys.argv) > 2 else r"C:\Windows\Fonts\malgun.ttf"

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# 배경 — 우상단 하늘색·좌하단 민트 글로우
glow = Image.new("RGB", (W, H), BG)
g = ImageDraw.Draw(glow)
g.ellipse([760, -260, 1460, 440], fill=(0, 60, 95))
g.ellipse([-320, 420, 380, 980], fill=(0, 70, 60))
glow = glow.filter(ImageFilter.GaussianBlur(140))
img = Image.blend(img, glow, 0.9)
d = ImageDraw.Draw(img)

# 격자(얇게)
for x in range(0, W, 60):
    d.line([(x, 0), (x, H)], fill=(10, 16, 32), width=1)
for y in range(0, H, 60):
    d.line([(0, y), (W, y)], fill=(10, 16, 32), width=1)

# 우측 장식 — 시세 곡선 2개
def curve(seed, base, amp, color, width):
    pts = []
    for i in range(0, 61):
        x = 640 + i * 9
        y = base - amp * (math.sin(i / 7.0 + seed) * 0.6 + math.sin(i / 3.1 + seed * 2) * 0.25 + i / 60.0 * 0.9)
        pts.append((x, y))
    d.line(pts, fill=color, width=width, joint="curve")
    return pts

p1 = curve(0.4, 440, 110, SKY, 5)
p2 = curve(2.1, 500, 70, MINT, 3)
# 마지막 점 강조
for pts, c in ((p1, SKY), (p2, MINT)):
    x, y = pts[-1]
    d.ellipse([x - 9, y - 9, x + 9, y + 9], fill=c)
    d.ellipse([x - 18, y - 18, x + 18, y + 18], outline=c, width=2)

# 텍스트
f_small = ImageFont.truetype(regular, 30)
f_brand = ImageFont.truetype(bold, 92)
f_sub = ImageFont.truetype(regular, 34)
f_url = ImageFont.truetype(bold, 28)
f_tag = ImageFont.truetype(regular, 24)

d.text((80, 120), "현건노일", font=f_small, fill=MINT)
d.text((76, 160), "NewsInsight", font=f_brand, fill=(240, 244, 255))
d.text((80, 290), "환율·금리·지수·원자재·코인 시세와", font=f_sub, fill=(205, 212, 230))
d.text((80, 338), "매일 아침 시장 브리핑, 세계 뉴스 요약", font=f_sub, fill=(205, 212, 230))

# 태그 칩
tags = ["달러/원", "미국 10년물", "코스피200", "나스닥100", "금", "비트코인"]
x = 80
for t in tags:
    tw = d.textlength(t, font=f_tag)
    d.rounded_rectangle([x, 420, x + tw + 28, 464], radius=10, outline=(40, 70, 110), width=2, fill=(8, 14, 30))
    d.text((x + 14, 428), t, font=f_tag, fill=(170, 200, 230))
    x += tw + 42

d.line([(80, 540), (1120, 540)], fill=(30, 45, 75), width=2)
d.text((80, 560), "hyeongeonnoil.com", font=f_url, fill=SKY)
d.text((1120 - d.textlength("Korea Market Briefing · Daily", font=f_tag), 562), "Korea Market Briefing · Daily", font=f_tag, fill=(140, 160, 190))

img.save("public/og-default.png", optimize=True)
print("saved public/og-default.png", img.size)
