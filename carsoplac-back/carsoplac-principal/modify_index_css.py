#!/usr/bin/env python3
import sys

def main():
    css_path = 'src/index.css'
    with open(css_path, 'r') as f:
        lines = f.readlines()
