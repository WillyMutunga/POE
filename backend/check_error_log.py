import os
import glob

search_paths = [
    '/home1/headwayc/poe.headwaycollege.ac.ke/error_log',
    '/home1/headwayc/public_html/error_log',
    '/home1/headwayc/poe_backend/error_log',
    '/home1/headwayc/logs/*',
    '/home1/headwayc/poe_backend/stderr.log',
    '/home1/headwayc/poe_backend/stdout.log'
]

log = []
log.append("Scanning for error logs...")

for p in search_paths:
    for path in glob.glob(p):
        if os.path.exists(path) and os.path.isfile(path):
            log.append(f"\n--- Found file: {path} (Size: {os.path.getsize(path)} bytes) ---")
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    lines = content.split('\n')
                    log.append("\n".join(lines[-50:]))
            except Exception as e:
                log.append(f"Error reading file: {e}")

# Output result
out_path = '/home1/headwayc/poe.headwaycollege.ac.ke/error_report.txt'
with open(out_path, 'w') as f:
    f.write("\n".join(log))
print("Done")
