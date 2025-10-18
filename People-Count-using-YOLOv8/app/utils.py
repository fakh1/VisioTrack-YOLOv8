import subprocess
import json

def run_people_counter(input_path, output_path):
    subprocess.run([
        "python", "main2.py",
        "--input", input_path,
        "--output", output_path
    ])
