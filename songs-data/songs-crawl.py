#!/usr/bin/env python3
"""
Crawl every character's songs from idol.st and build a merged songs.json.

Flow:
  1. Read all character slugs (the "slug" field) from characters.json.
  2. For each character, auto-discover the page count and crawl every page.
  3. Accumulate songs keyed by song id. The first time a song is seen it is
     added in full; every time it reappears (for another character) we just
     append that character to the song's "characters" list.
  4. Write the result to songs.json.

Usage:
    python3 songs-crawl.py
"""

import html
import json
import os
import re
import sys
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CHARACTERS_JSON = os.path.join(HERE, "characters.json")
OUTPUT_JSON = os.path.join(HERE, "songs-original.json")

BASE = "https://idol.st/ajax/songs/{slug}/?page={page}"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
}

# One <div ... data-item="song" data-item-id="NNN"> ... </div> per song. We
# split the document on the item marker and parse each chunk independently.
ITEM_SPLIT = re.compile(r'data-item="song"\s+data-item-id="(\d+)"')


def fetch(slug, page):
    """Return the HTML for one page of a character's songs list."""
    url = BASE.format(slug=slug, page=page)
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", "replace")


def last_page(doc):
    """Largest ?page=N referenced in the pagination block (1 if none)."""
    pages = [int(n) for n in re.findall(r"\?page=(\d+)", doc)]
    return max(pages) if pages else 1


def parse_songs(doc):
    """Yield dicts for every song item in the document, in order."""
    parts = ITEM_SPLIT.split(doc)
    # parts = [before, id1, chunk1, id2, chunk2, ...]
    for i in range(1, len(parts), 2):
        song_id = int(parts[i])
        chunk = parts[i + 1]

        # Title + slug live on the .a-nodifference anchor.
        anchor = re.search(
            r'<a[^>]*href="/song/\d+/([^"/]*)/?"[^>]*data-ajax-title="([^"]*)"[^>]*class="a-nodifference"',
            chunk,
        )
        if not anchor:
            anchor = re.search(
                r'<a[^>]*href="/song/\d+/([^"/]*)/?"[^>]*class="a-nodifference"[^>]*data-ajax-title="([^"]*)"',
                chunk,
            )
        slug = html.unescape(anchor.group(1)) if anchor else ""
        name = html.unescape(anchor.group(2)).strip() if anchor else ""

        # Cover image.
        img = re.search(r'<img[^>]*class="song-image[^"]*"[^>]*>', chunk)
        image = ""
        if img:
            src = re.search(r'src="([^"]+)"', img.group(0))
            image = html.unescape(src.group(1)) if src else ""

        # Japanese title, if present, sits in the <small lang="ja"> block.
        jp = re.search(
            r'<small[^>]*lang="ja"[^>]*>(.*?)</small>', chunk, re.DOTALL
        )
        jp_name = None
        if jp:
            text = re.sub(r"<[^>]+>", "", jp.group(1))
            text = html.unescape(text).strip()
            if text:
                jp_name = text

        yield {
            "id": song_id,
            "name": name,
            "jp_name": jp_name,
            "slug": slug,
            "image": image,
        }


def crawl_character(slug):
    """Yield every song dict for a single character across all pages."""
    try:
        first = fetch(slug, 1)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f"[{slug}] no songs page (404) — skipping", file=sys.stderr)
            return
        raise
    total = last_page(first)
    print(f"[{slug}] {total} page(s)", file=sys.stderr)
    for page in range(1, total + 1):
        doc = first if page == 1 else fetch(slug, page)
        songs = list(parse_songs(doc))
        print(f"  page {page}: {len(songs)} songs", file=sys.stderr)
        yield from songs
        if page != total:
            time.sleep(1)  # be polite to the server


def main():
    with open(CHARACTERS_JSON, encoding="utf-8") as f:
        characters = json.load(f)["characters"]
    slugs = [c["slug"] for c in characters]
    print(f"{len(slugs)} characters to crawl", file=sys.stderr)

    # song id -> merged song record (insertion order = first-seen order)
    songs = {}
    for slug in slugs:
        for song in crawl_character(slug):
            sid = song["id"]
            if sid not in songs:
                songs[sid] = {
                    "id": sid,
                    "name": song["name"],
                    "jp_name": song["jp_name"],
                    "slug": song["slug"],
                    "image": song["image"],
                    "characters": [],
                }
            if slug not in songs[sid]["characters"]:
                songs[sid]["characters"].append(slug)

    payload = {"songs": sorted(songs.values(), key=lambda s: s["id"])}
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=4)
        f.write("\n")

    print(
        f"Wrote {len(songs)} unique songs -> {OUTPUT_JSON}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()

