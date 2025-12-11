"""Example Python JCAMP parser using 'jcamp' Python package (install via pip)

Usage:
  python parse_jcamp.py sample.jdx

This is scaffolding to show how Python support could be added per library recommendations.
"""
import sys
try:
    import jcamp
except Exception as e:
    print('Please install requirements from requirements.txt (pip install -r requirements.txt)')
    raise

import json


def parse_file(path):
    with open(path, 'r') as f:
        text = f.read()
    parsed = jcamp.loads(text)
    print(json.dumps(parsed, indent=2))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python parse_jcamp.py <file.jdx>')
        sys.exit(1)
    parse_file(sys.argv[1])
