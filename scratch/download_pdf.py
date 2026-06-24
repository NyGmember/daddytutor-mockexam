import urllib.request
import os

def download_file(url, filename):
    print(f"Downloading {url} to {filename}...")
    try:
        urllib.request.urlretrieve(url, filename)
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")

os.makedirs("scratch", exist_ok=True)
download_file("https://tedet.ac.th/inexam/sheet57/science/TEDET_Science_Ans_G8.pdf", "scratch/TEDET_Science_Ans_G8.pdf")
download_file("https://tedet.ac.th/inexam/sheet57/science/TEDET_Science_Ans_G9.pdf", "scratch/TEDET_Science_Ans_G9.pdf")
