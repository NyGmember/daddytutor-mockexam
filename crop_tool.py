import sys
import os
from PIL import Image

def main():
    if len(sys.argv) < 7:
        print("Usage: python crop_tool.py <image_path> <output_path> <ymin> <xmin> <ymax> <xmax>")
        sys.exit(1)

    img_path = sys.argv[1]
    out_path = sys.argv[2]
    
    try:
        ymin = float(sys.argv[3])
        xmin = float(sys.argv[4])
        ymax = float(sys.argv[5])
        xmax = float(sys.argv[6])
    except ValueError:
        print("Error: Bounding box coordinates must be numeric values between 0 and 1000.")
        sys.exit(1)

    if not os.path.exists(img_path):
        print(f"Error: Source image not found at {img_path}")
        sys.exit(1)

    # Ensure output parent directory exists
    out_dir = os.path.dirname(out_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    img = Image.open(img_path)
    w, h = img.size

    # Convert 0-1000 normalized scale to pixel coordinates
    left = int(xmin * w / 1000)
    top = int(ymin * h / 1000)
    right = int(xmax * w / 1000)
    bottom = int(ymax * h / 1000)

    # Clamp coordinates to image boundaries
    left = max(0, min(left, w - 1))
    top = max(0, min(top, h - 1))
    right = max(left + 1, min(right, w))
    bottom = max(top + 1, min(bottom, h))

    try:
        cropped = img.crop((left, top, right, bottom))
        cropped.save(out_path)
        print(f"Successfully cropped image {img_path} and saved to {out_path}")
    except Exception as e:
        print(f"Error cropping image: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
