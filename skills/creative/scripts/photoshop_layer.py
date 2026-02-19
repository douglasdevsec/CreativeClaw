import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description="Create a layer in Photoshop")
    parser.add_argument("--name", required=True, help="Layer name")
    parser.add_argument("--color", help="Fill color")
    args = parser.parse_args()

    print(f"[CreativeClaw] Connecting to Photoshop...")
    print(f"[CreativeClaw] Creating layer '{args.name}'...")
    if args.color:
        print(f"[CreativeClaw] Filling with color '{args.color}'...")
    
    # Mock success
    print(f"[CreativeClaw] Layer '{args.name}' created successfully.")
    sys.exit(0)

if __name__ == "__main__":
    main()
