import os

def main():
    log = []
    log.append("Starting htaccess check and fix...")
    
    htaccess_path = '/home1/headwayc/poe.headwaycollege.ac.ke/.htaccess'
    log.append(f"Checking htaccess at: {htaccess_path}")
    
    if os.path.exists(htaccess_path):
        with open(htaccess_path, 'r') as f:
            content = f.read()
        log.append("Original .htaccess content:")
        log.append(content)
        
        # Check if FollowSymLinks is in the file
        if "FollowSymLinks" not in content and "SymLinksIfOwnerMatch" not in content:
            log.append("FollowSymLinks or SymLinksIfOwnerMatch not found. Adding Options +FollowSymLinks")
            new_content = "Options +FollowSymLinks\n\n" + content
            with open(htaccess_path, 'w') as f:
                f.write(new_content)
            log.append("Updated .htaccess successfully.")
        else:
            log.append("FollowSymLinks or SymLinksIfOwnerMatch is already present in .htaccess.")
    else:
        log.append(".htaccess file does not exist in web root. Creating one with FollowSymLinks.")
        with open(htaccess_path, 'w') as f:
            f.write("Options +FollowSymLinks\n")
        log.append(".htaccess created successfully.")
        
    # Check if we can read the media files through the symlink from the web root
    web_media_dir = '/home1/headwayc/poe.headwaycollege.ac.ke/media/evidence'
    if os.path.exists(web_media_dir):
        log.append(f"Web media evidence directory is readable. Files: {os.listdir(web_media_dir)}")
    else:
        log.append(f"Web media evidence directory is NOT readable or does not exist.")

    # Write log to file
    with open('/home1/headwayc/poe_backend/media_status.txt', 'w') as f:
        f.write("\n".join(log))
    print("Done")

if __name__ == '__main__':
    main()
