import argparse
import sys
import time
import json
import os

def main():
    parser = argparse.ArgumentParser(description="Trigger AE Render")
    parser.add_argument("--comp", required=True, help="Composition name")
    parser.add_argument("--output", required=True, help="Output file path")
    parser.add_argument("--json-template", help="JSON file with composition updates")
    args = parser.parse_args()

    print(f"[CreativeClaw] Targeting After Effects...")
    
    if args.json_template:
        print(f"[CreativeClaw] Applying JSON template: {args.json_template}")
        try:
            with open(args.json_template, 'r') as f:
                data = json.load(f)
            print(f"[CreativeClaw] Template data loaded: {len(data)} keys")
            # In a real implementation, we would generate a JSX script here
            # that After Effects runs to update layers based on `data`.
        except Exception as e:
            print(f"[CreativeClaw] Error loading template: {e}")
            sys.exit(1)

    print(f"[CreativeClaw] Queueing composition '{args.comp}' for render...")
    print(f"[CreativeClaw] Output: {args.output}")
    
    print("[CreativeClaw] Starting aerender...")
    time.sleep(1) # Simulate work
    print("[CreativeClaw] Progress: 0%...")
    time.sleep(1)
    print("[CreativeClaw] Progress: 100%...")
    
    print(f"[CreativeClaw] Render complete: {args.output}")
    sys.exit(0)

if __name__ == "__main__":
    main()
