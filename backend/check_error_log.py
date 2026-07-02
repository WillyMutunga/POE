import os
import glob

log = []
log.append("Scanning for .htaccess files and backups...")

search_dir = '/home1/headwayc/poe.headwaycollege.ac.ke/'
for root, dirs, files in os.walk(search_dir):
    # Only scan the root directory, don't recurse deep
    if root != search_dir:
        continue
    for f in files:
        if 'htaccess' in f.lower():
            path = os.path.join(root, f)
            log.append(f"\n--- Found .htaccess file: {path} (Size: {os.path.getsize(path)} bytes) ---")
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                    log.append(file.read())
            except Exception as e:
                log.append(f"Error reading file: {e}")

# Output result
out_path = '/home1/headwayc/poe.headwaycollege.ac.ke/error_report.txt'
with open(out_path, 'w') as f:
    f.write("\n".join(log))
print("Done")
