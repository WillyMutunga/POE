import os

log = []
log.append("Scanning for all files in poe.headwaycollege.ac.ke directory tree...")

search_dir = '/home1/headwayc/poe.headwaycollege.ac.ke'
for root, dirs, files in os.walk(search_dir):
    for f in files:
        if 'htaccess' in f.lower():
            path = os.path.join(root, f)
            log.append(f"\n--- Found file: {path} (Size: {os.path.getsize(path)} bytes) ---")
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                    log.append(file.read())
            except Exception as e:
                log.append(f"Error reading file: {e}")

# Also scan poe_backend/ directory to see if there is any htaccess there
backend_dir = '/home1/headwayc/poe_backend'
if os.path.exists(backend_dir):
    log.append("\nScanning poe_backend/ directory...")
    for root, dirs, files in os.walk(backend_dir):
        # Only check top level of backend
        if root != backend_dir:
            continue
        for f in files:
            if 'htaccess' in f.lower():
                path = os.path.join(root, f)
                log.append(f"\n--- Found file in backend: {path} ---")
                try:
                    with open(path, 'r') as file:
                        log.append(file.read())
                except Exception as e:
                    log.append(f"Error: {e}")

# Output result
out_path = '/home1/headwayc/poe.headwaycollege.ac.ke/error_report.txt'
with open(out_path, 'w') as f:
    f.write("\n".join(log))
print("Done")
