#!/usr/bin/env python3
"""Diff parity output from Python and JS guided protocol engines.

Compares parity-output/guided.python.json vs parity-output/guided.js.json.
Fails (exit 1) on any divergence.

Usage:
    python scripts/parity_diff.py
    python scripts/parity_diff.py --python parity-output/guided.python.json \
                                   --js parity-output/guided.js.json
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

DEFAULT_PYTHON = ROOT / "parity-output" / "guided.python.json"
DEFAULT_JS = ROOT / "parity-output" / "guided.js.json"


def deep_diff(a, b, path=""):
    """Return list of (path, python_value, js_value) for every divergence."""
    diffs = []

    if type(a) != type(b):  # noqa: E721
        diffs.append((path or "<root>", a, b))
        return diffs

    if isinstance(a, dict):
        all_keys = sorted(set(a.keys()) | set(b.keys()))
        for key in all_keys:
            child_path = f"{path}.{key}" if path else key
            if key not in a:
                diffs.append((child_path, "<missing>", b[key]))
            elif key not in b:
                diffs.append((child_path, a[key], "<missing>"))
            else:
                diffs.extend(deep_diff(a[key], b[key], child_path))
    elif isinstance(a, list):
        max_len = max(len(a), len(b))
        for i in range(max_len):
            child_path = f"{path}[{i}]"
            if i >= len(a):
                diffs.append((child_path, "<missing>", b[i]))
            elif i >= len(b):
                diffs.append((child_path, a[i], "<missing>"))
            else:
                diffs.extend(deep_diff(a[i], b[i], child_path))
    else:
        # Normalise numeric strings for comparison (Decimal.js may produce
        # "120" where Python produces "120.0" or vice versa)
        a_norm = str(a) if a is not None else ""
        b_norm = str(b) if b is not None else ""
        # Strip trailing .0 for comparison
        if a_norm.endswith(".0"):
            a_norm = a_norm[:-2]
        if b_norm.endswith(".0"):
            b_norm = b_norm[:-2]
        if a_norm != b_norm:
            diffs.append((path, a, b))

    return diffs


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Diff Python vs JS parity output.")
    parser.add_argument("--python", default=str(DEFAULT_PYTHON), help="Python JSON path")
    parser.add_argument("--js", default=str(DEFAULT_JS), help="JS JSON path")
    args = parser.parse_args()

    python_path = Path(args.python)
    js_path = Path(args.js)

    if not python_path.exists():
        print(f"ERROR: Python output not found: {python_path}", file=sys.stderr)
        print("Run: python backend/scripts/parity_guided_python.py -o parity-output/guided.python.json", file=sys.stderr)
        sys.exit(1)

    if not js_path.exists():
        print(f"ERROR: JS output not found: {js_path}", file=sys.stderr)
        print("Run: npx tsx frontend/scripts/parity_guided_js.ts -o parity-output/guided.js.json", file=sys.stderr)
        sys.exit(1)

    python_data = json.loads(python_path.read_text(encoding="utf-8"))
    js_data = json.loads(js_path.read_text(encoding="utf-8"))

    # Compare engine metadata
    if python_data.get("engine") != "python":
        print(f"WARNING: Python file engine={python_data.get('engine')}", file=sys.stderr)
    if js_data.get("engine") != "javascript":
        print(f"WARNING: JS file engine={js_data.get('engine')}", file=sys.stderr)

    # Compare scenarios
    python_scenarios = {s["scenario"]: s for s in python_data.get("scenarios", [])}
    js_scenarios = {s["scenario"]: s for s in js_data.get("scenarios", [])}

    all_names = sorted(set(python_scenarios.keys()) | set(js_scenarios.keys()))

    total_diffs = 0
    for name in all_names:
        if name not in python_scenarios:
            print(f"\nFAIL: Scenario '{name}' missing in Python output")
            total_diffs += 1
            continue
        if name not in js_scenarios:
            print(f"\nFAIL: Scenario '{name}' missing in JS output")
            total_diffs += 1
            continue

        diffs = deep_diff(python_scenarios[name], js_scenarios[name])
        if diffs:
            print(f"\nFAIL: Scenario '{name}' — {len(diffs)} divergence(s):")
            for path, py_val, js_val in diffs:
                print(f"  {path}:")
                print(f"    python: {py_val}")
                print(f"    js:     {js_val}")
            total_diffs += len(diffs)

    if total_diffs == 0:
        print("PASS: All scenarios match between Python and JS engines.")
        sys.exit(0)
    else:
        print(f"\nFAILED: {total_diffs} total divergence(s) found.")
        sys.exit(1)


if __name__ == "__main__":
    main()
