import os
import shutil

def main():
    log = []
    log.append("Starting media directory check and fix...")
    
    web_media = '/home1/headwayc/poe.headwaycollege.ac.ke/media'
    backend_media = '/home1/headwayc/poe_backend/media'
    
    log.append(f"Web media path: {web_media}")
    log.append(f"Backend media path: {backend_media}")
    
    # 1. Check if backend media folder exists
    if not os.path.exists(backend_media):
        log.append("Backend media folder does not exist. Creating it.")
        os.makedirs(backend_media, exist_ok=True)
    else:
        log.append("Backend media folder exists.")
        
    # 2. Check if web media path exists
    if os.path.lexists(web_media):
        log.append("Web media path exists.")
        if os.path.islink(web_media):
            target = os.readlink(web_media)
            log.append(f"Web media path is a symlink pointing to: {target}")
            if target != backend_media:
                log.append(f"Symlink points to wrong path. Deleting symlink and recreating.")
                os.unlink(web_media)
                os.symlink(backend_media, web_media)
                log.append("Symlink recreated successfully.")
            else:
                log.append("Symlink points to correct path. Nothing to do.")
        else:
            log.append("Web media path is a normal directory, not a symlink.")
            # If it's a directory, let's see if it has files
            files = os.listdir(web_media)
            log.append(f"Web media directory contains {len(files)} files: {files}")
            
            # We should probably rename it and create the symlink
            backup_path = web_media + "_backup"
            log.append(f"Moving web media directory to backup: {backup_path}")
            if os.path.exists(backup_path):
                shutil.rmtree(backup_path)
            shutil.move(web_media, backup_path)
            
            # Now create symlink
            os.symlink(backend_media, web_media)
            log.append("Created symlink pointing to backend media folder.")
            
            # Copy files from backup to backend media
            log.append("Copying files from backup to backend media...")
            for f in os.listdir(backup_path):
                src = os.path.join(backup_path, f)
                dst = os.path.join(backend_media, f)
                if os.path.isdir(src):
                    shutil.copytree(src, dst, dirs_exist_ok=True)
                else:
                    shutil.copy2(src, dst)
            log.append("Files copied successfully from backup to backend media.")
    else:
        log.append("Web media path does not exist. Creating symlink.")
        os.symlink(backend_media, web_media)
        log.append("Symlink created successfully.")

    # Write log to file
    with open('/home1/headwayc/poe_backend/media_status.txt', 'w') as f:
        f.write("\n".join(log))
    print("Done")

if __name__ == '__main__':
    main()
