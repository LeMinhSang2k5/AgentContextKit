#!/usr/bin/env python3
"""Render lightweight terminal-style GIFs for the README.

This helper is intentionally optional. It uses Pillow when available and writes
generated animations to docs/assets/.
"""

from __future__ import annotations

from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError as exc:  # pragma: no cover - local asset helper only
    raise SystemExit("Pillow is required to render the README demo GIF.") from exc


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "assets"

WIDTH = 1120
HEIGHT = 620
PADDING = 34
HEADER = 54
LINE_HEIGHT = 24

BG = "#0f1117"
PANEL = "#171a22"
PANEL_EDGE = "#2b3240"
TEXT = "#e6edf3"
MUTED = "#8b949e"
GREEN = "#3fb950"
CYAN = "#58a6ff"
YELLOW = "#d29922"
RED = "#ff7b72"


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Menlo.ttc",
        "/System/Library/Fonts/SFNSMono.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf" if bold else "",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            try:
                return ImageFont.truetype(candidate, size=size)
            except OSError:
                continue
    return ImageFont.load_default()


FONT = load_font(19)
FONT_BOLD = load_font(19, bold=True)
FONT_SMALL = load_font(15)


def line(text: str, color: str = TEXT) -> tuple[str, str]:
    return (text, color)


DEMOS = {
    "demo.gif": {
        "intro": [
            ("rfa init --dry-run", TEXT),
            ("Make any repository AI-agent-ready in 30 seconds.", CYAN),
            ("Generate context files for Codex, Cursor, Claude, and Copilot.", TEXT),
            ("No AI API required. Safe dry-run first.", MUTED),
        ],
        "scenes": [
            {
                "command": "npx --package ready-for-agents -- rfa init --dry-run",
                "output": [
                    line("rfa init"),
                    line(""),
                    line("Detected:", CYAN),
                    line("- Project: ai-dashboard"),
                    line("- Package manager: pnpm"),
                    line("- Framework: React/Vite + Express"),
                    line("- Database: MongoDB/Mongoose"),
                    line("- Scripts: dev, build, test, typecheck"),
                    line(""),
                    line("Would generate:", CYAN),
                    line("- AGENTS.md", GREEN),
                    line("- PROJECT_CONTEXT.md", GREEN),
                    line("- COMMANDS.md", GREEN),
                    line("- .ready-for-agents/context-tree.json", GREEN),
                    line(""),
                    line("Dry run - no files written.", MUTED),
                ],
            },
            {
                "command": 'rfa query "how should I verify this change?"',
                "output": [
                    line("rfa query"),
                    line(""),
                    line("Relevant context:", CYAN),
                    line("1. COMMANDS.md > Test", GREEN),
                    line("2. PROJECT_CONTEXT.md > Stack", GREEN),
                    line("3. AGENTS.md > Testing Expectations", GREEN),
                    line(""),
                    line("Suggested prompt:", CYAN),
                    line("Verify this change using the repo commands in COMMANDS.md."),
                    line("Run typecheck, tests, and build when available."),
                ],
            },
        ],
    },
    "demo-init.gif": {
        "intro": [
            ("rfa init", TEXT),
            ("Generate the core context layer for any Node.js repo.", CYAN),
            ("AGENTS.md, PROJECT_CONTEXT.md, COMMANDS.md, and context tree.", TEXT),
        ],
        "scenes": [
            {
                "command": "rfa init --dry-run --index",
                "output": [
                    line("Detected:", CYAN),
                    line("- Project: todoist-style-demo"),
                    line("- Package manager: npm"),
                    line("- Framework: React/Vite + Express"),
                    line("- Database: MongoDB/Mongoose"),
                    line("- Scripts: dev, dev:client, dev:server, build"),
                    line(""),
                    line("Would generate:", CYAN),
                    line("- AGENTS.md", GREEN),
                    line("- PROJECT_CONTEXT.md", GREEN),
                    line("- COMMANDS.md", GREEN),
                    line("- .ready-for-agents/context-tree.json", GREEN),
                    line(""),
                    line("Dry run - no files written.", MUTED),
                ],
            }
        ],
    },
    "demo-doctor.gif": {
        "intro": [
            ("rfa doctor", TEXT),
            ("Check readiness and repair missing generated context safely.", CYAN),
            ("Use --json for CI, --fix for controlled file generation.", TEXT),
        ],
        "scenes": [
            {
                "command": "rfa doctor --cwd .",
                "output": [
                    line("Checks:", CYAN),
                    line("✓ Project directory found", GREEN),
                    line("✓ package.json found", GREEN),
                    line("✓ Package manager detected: pnpm", GREEN),
                    line("! AGENTS.md found", YELLOW),
                    line("! PROJECT_CONTEXT.md found", YELLOW),
                    line("✓ build script found", GREEN),
                    line("✓ README.md found", GREEN),
                    line(""),
                    line("Score: 8/11 · 3 warnings · 0 failures", CYAN),
                ],
            },
            {
                "command": "rfa doctor --fix --dry-run",
                "output": [
                    line("Fix preview:", CYAN),
                    line("Would generate:", CYAN),
                    line("- AGENTS.md", GREEN),
                    line("- PROJECT_CONTEXT.md", GREEN),
                    line("- COMMANDS.md", GREEN),
                    line("- .ready-for-agents/context-tree.json", GREEN),
                    line(""),
                    line("Dry run - no files written.", MUTED),
                ],
            },
        ],
    },
    "demo-prompt-query.gif": {
        "intro": [
            ("rfa p", TEXT),
            ("Turn rough instructions into compact prompts with relevant context.", CYAN),
            ("Query reads the context tree before agents open full files.", TEXT),
        ],
        "scenes": [
            {
                "command": 'rfa p "kiểm tra doctor --json hoạt động đúng chưa"',
                "output": [
                    line("## Task", CYAN),
                    line("Verify whether `doctor --json` works correctly."),
                    line(""),
                    line("## Context", CYAN),
                    line("- COMMANDS.md > Test", GREEN),
                    line("- CLI_SPEC.md > doctor", GREEN),
                    line("- TEST_STRATEGY.md > Doctor", GREEN),
                    line(""),
                    line("## Verify", CYAN),
                    line("- Run the focused doctor tests."),
                    line("- Confirm stdout is one parseable JSON object."),
                ],
            },
            {
                "command": 'rfa query "doctor json ci"',
                "output": [
                    line("Matches:", CYAN),
                    line("1. COMMANDS.md#test", GREEN),
                    line("2. CLI_SPEC.md#doctor", GREEN),
                    line("3. REQUIREMENTS.md#fr-doctor", GREEN),
                    line(""),
                    line("Estimated context: 420 tokens", MUTED),
                ],
            },
        ],
    },
    "demo-runbook-revive.gif": {
        "intro": [
            ("rfa revive", TEXT),
            ("Come back to an old project with a safe runbook and next steps.", CYAN),
            ("Secret values stay out of generated files.", TEXT),
        ],
        "scenes": [
            {
                "command": "rfa runbook --dry-run",
                "output": [
                    line("Privacy: .env values are not read or written.", MUTED),
                    line(""),
                    line("Would generate:", CYAN),
                    line("- RUNBOOK.md", GREEN),
                    line(""),
                    line("Environment:", CYAN),
                    line("- JWT_SECRET from source references", TEXT),
                    line("- MONGODB_URI from source references", TEXT),
                    line("- Values not read", MUTED),
                ],
            },
            {
                "command": "rfa revive --dry-run",
                "output": [
                    line("Revival automation:", CYAN),
                    line("- RUNBOOK.md", GREEN),
                    line("- docker-compose.yml", GREEN),
                    line("- .ready-for-agents/context-tree.json", GREEN),
                    line(""),
                    line("Next steps:", CYAN),
                    line("- docker compose up -d"),
                    line("- npm install"),
                    line("- npm run dev"),
                    line("- Open RUNBOOK.md"),
                ],
            },
        ],
    },
    "demo-docker.gif": {
        "intro": [
            ("rfa docker", TEXT),
            ("Generate local database/cache services without touching secrets.", CYAN),
            ("Supported: MongoDB, PostgreSQL, MySQL, Redis.", TEXT),
        ],
        "scenes": [
            {
                "command": "rfa docker --dry-run",
                "output": [
                    line("Detected local services:", CYAN),
                    line("- MongoDB: mongo:7 on 27017", GREEN),
                    line("- Redis: redis:7-alpine on 6379", GREEN),
                    line(""),
                    line("Would generate:", CYAN),
                    line("- docker-compose.yml", GREEN),
                    line(""),
                    line("Suggested local environment values:", CYAN),
                    line("- MONGODB_URI=mongodb://localhost:27017/app"),
                    line("- REDIS_URL=redis://localhost:6379"),
                    line(""),
                    line("Dry run - no files written.", MUTED),
                ],
            }
        ],
    },
    "demo-ci-diff.gif": {
        "intro": [
            ("rfa ci + diff", TEXT),
            ("Keep generated context fresh in pull requests.", CYAN),
            ("CI can fail when context files drift from the project.", TEXT),
        ],
        "scenes": [
            {
                "command": "rfa ci --dry-run",
                "output": [
                    line("Would generate:", CYAN),
                    line("- .github/workflows/ready-for-agents.yml", GREEN),
                    line(""),
                    line("Workflow steps:", CYAN),
                    line("- rfa doctor --json --cwd ."),
                    line("- rfa diff --json --cwd ."),
                    line(""),
                    line("Dry run - no files written.", MUTED),
                ],
            },
            {
                "command": "rfa diff --json",
                "output": [
                    line("{", TEXT),
                    line('  "ok": false,', YELLOW),
                    line('  "missing": ["AGENTS.md"],', TEXT),
                    line('  "outdated": ["COMMANDS.md"],', TEXT),
                    line('  "diffs": [ ... ]', TEXT),
                    line("}", TEXT),
                ],
            },
        ],
    },
}


def draw_window(draw: ImageDraw.ImageDraw) -> None:
    draw.rounded_rectangle(
        (18, 18, WIDTH - 18, HEIGHT - 18),
        radius=14,
        fill=PANEL,
        outline=PANEL_EDGE,
        width=2,
    )
    dot_y = 40
    for idx, color in enumerate([RED, YELLOW, GREEN]):
        x = 42 + idx * 24
        draw.ellipse((x, dot_y - 7, x + 14, dot_y + 7), fill=color)
    draw.text((WIDTH - 280, 31), "ready-for-agents demo", fill=MUTED, font=FONT_SMALL)


def draw_frame(command: str, output: list[tuple[str, str]], visible_output: int) -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(image)
    draw_window(draw)

    x = PADDING + 18
    y = HEADER + 28
    draw.text((x, y), "$", fill=GREEN, font=FONT_BOLD)
    draw.text((x + 28, y), command, fill=TEXT, font=FONT_BOLD)
    y += LINE_HEIGHT + 22

    for line, color in output[:visible_output]:
        if line:
            draw.text((x, y), line, fill=color, font=FONT)
        y += LINE_HEIGHT

    return image


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for filename, demo in DEMOS.items():
        render_demo(filename, demo)


def render_demo(filename: str, demo: dict[str, object]) -> None:
    out = OUT_DIR / filename

    frames: list[Image.Image] = []
    durations: list[int] = []
    intro = demo["intro"]
    if not isinstance(intro, list):
        raise TypeError("demo intro must be a list")
    intro_command, *intro_lines = intro
    frames.append(draw_frame(intro_command[0], intro_lines, len(intro_lines)))
    durations.append(1200)

    scenes = demo["scenes"]
    if not isinstance(scenes, list):
        raise TypeError("demo scenes must be a list")
    for scene in scenes:
        command = scene["command"]
        output = scene["output"]
        for index in range(8, len(command) + 1, 4):
            frames.append(draw_frame(command[:index] + "█", [], 0))
            durations.append(35)
        frames.append(draw_frame(command, [], 0))
        durations.append(250)
        for visible in range(1, len(output) + 1):
            frames.append(draw_frame(command, output, visible))
            durations.append(75)
        durations[-1] = 1400

    frames[0].save(
        out,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        optimize=True,
    )
    print(f"Rendered {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
