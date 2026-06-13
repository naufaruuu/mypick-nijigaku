#!/usr/bin/env python3
"""
Build songs-final.json — a bucketed, inverted index of songs keyed by slug.

Inputs (all local, no network):
  songs-details.json   base list of songs (id, name, jp_name, slug, image,
                       characters)
  songs-override.json  manual relabels applied by song slug (e.g. a song's
                       characters swapped to "Cross-Gen" / a pairing label)
  groups.json          group definitions, each with a slug and one or more
                       member lineups (the "OR relationship" — any lineup
                       counts as that group)
  characters.json      the real characters (used to recognise solo songs)

Output:
  songs-final.json     { "songs-final": { <bucket-slug>: [song-slug, ...] } }

Bucketing rule for each song, in order:
  1. group   — its exact character-set matches one of a group's lineups
               -> bucket = that group's slug
  2. solo    — exactly one character and that character is a real character
               -> bucket = the character's slug
  3. Others  — anything else (override labels, pairings, odd line-ups)
               -> bucket = "Others"

Bucket order in the output: groups (groups.json order), then characters
(characters.json order), then "Others". Empty buckets are omitted. Songs
inside a bucket keep songs-details order (id-ascending).

Usage:
    python3 songs-build.py
"""

import copy
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DETAILS = os.path.join(HERE, "songs-details.json")
OVERRIDE = os.path.join(HERE, "songs-override.json")
GROUPS = os.path.join(HERE, "groups.json")
CHARACTERS = os.path.join(HERE, "characters.json")
FINAL = os.path.join(HERE, "songs-final.json")


def load(path, key):
    with open(path, encoding="utf-8") as f:
        return json.load(f)[key]


def main():
    songs = copy.deepcopy(load(DETAILS, "songs-details"))
    overrides = load(OVERRIDE, "songs-override")
    groups = load(GROUPS, "groups")
    characters = load(CHARACTERS, "characters")

    # --- apply overrides (matched by slug) ---
    by_slug = {s["slug"]: s for s in songs}
    for ov in overrides:
        target = by_slug.get(ov["slug"])
        if target is None:
            print(f"WARNING: override slug '{ov['slug']}' matched no song",
                  file=sys.stderr)
            continue
        target.update(ov["override"])

    # --- index group lineups: frozenset(members) -> group slug ---
    lineup_to_group = {}
    for g in groups:
        for lineup in g["members"]:
            lineup_to_group[frozenset(lineup)] = g["slug"]

    real_characters = {c["slug"] for c in characters}

    # --- prepare ordered, empty buckets ---
    buckets = {}
    for g in groups:
        buckets[g["slug"]] = []
    for c in characters:
        buckets[c["slug"]] = []
    buckets["Others"] = []

    # --- classify every song ---
    counts = {"group": 0, "solo": 0, "others": 0}
    for song in songs:
        chars = song["characters"]
        cset = frozenset(chars)

        group_slug = lineup_to_group.get(cset)
        if group_slug is not None:
            buckets[group_slug].append(song["slug"])
            counts["group"] += 1
        elif len(chars) == 1 and chars[0] in real_characters:
            buckets[chars[0]].append(song["slug"])
            counts["solo"] += 1
        else:
            buckets["Others"].append(song["slug"])
            counts["others"] += 1

    # --- drop empty buckets, preserving order ---
    final = {slug: items for slug, items in buckets.items() if items}

    with open(FINAL, "w", encoding="utf-8") as f:
        json.dump({"songs-final": final}, f, ensure_ascii=False, indent=4)
        f.write("\n")

    total = sum(counts.values())
    print(
        f"Built {len(final)} buckets from {total} songs "
        f"(group={counts['group']}, solo={counts['solo']}, "
        f"others={counts['others']}) -> {FINAL}",
        file=sys.stderr,
    )
    for slug, items in final.items():
        print(f"  {slug}: {len(items)}", file=sys.stderr)


if __name__ == "__main__":
    main()
