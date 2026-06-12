import os

def main():
    log = []
    log.append("Starting htaccess check and fix...")
    
    htaccess_path = '/home1/headwayc/poe.headwaycollege.ac.ke/.htaccess'
    log.append(f"Checking htaccess at: {htaccess_path}")
    
    if os.path.exists(htaccess_path):
        with open(htaccess_path, 'r') as f:
            content = f.read()
        log.append("Original .htaccess content read.")
        
        # We need to remove the broken media rewrite rule
        broken_rule = [
            "  # 2. Media Assets Rule: Map the public frontend URL directly to the backend storage directory",
            "  RewriteCond %{REQUEST_URI} ^/media/ [NC]",
            "  RewriteRule ^media/(.*)$ /poe_backend/media/$1 [L]"
        ]
        
        has_change = False
        new_lines = []
        lines = content.split('\n')
        i = 0
        while i < len(lines):
            line = lines[i]
            # Check if this and subsequent lines match the broken rule
            if (i + 2 < len(lines) and 
                "Media Assets Rule" in lines[i] and 
                "RewriteCond %{REQUEST_URI} ^/media/" in lines[i+1] and 
                "RewriteRule ^media/" in lines[i+2]):
                
                log.append("Found broken media rewrite rule. Commenting it out.")
                new_lines.append("  # [FIXED] Removed broken media rewrite rule to let Apache follow the symlink")
                new_lines.append("  # " + lines[i].strip())
                new_lines.append("  # " + lines[i+1].strip())
                new_lines.append("  # " + lines[i+2].strip())
                i += 3
                has_change = True
            else:
                new_lines.append(line)
                i += 1
                
        # Ensure Options +FollowSymLinks is at the top
        final_content = "\n".join(new_lines)
        if "FollowSymLinks" not in final_content and "SymLinksIfOwnerMatch" not in final_content:
            log.append("FollowSymLinks or SymLinksIfOwnerMatch not found. Adding Options +FollowSymLinks")
            final_content = "Options +FollowSymLinks\n\n" + final_content
            has_change = True
            
        if has_change:
            with open(htaccess_path, 'w') as f:
                f.write(final_content)
            log.append("Updated .htaccess successfully.")
        else:
            log.append("No changes were needed in .htaccess.")
    else:
        log.append(".htaccess file does not exist in web root. Creating one with FollowSymLinks.")
        with open(htaccess_path, 'w') as f:
            f.write("Options +FollowSymLinks\n")
        log.append(".htaccess created successfully.")
        
    # Check if we can read the media files through the symlink from the web root
    web_media_dir = '/home1/headwayc/poe.headwaycollege.ac.ke/media/evidence'
    if os.path.exists(web_media_dir):
        log.append(f"Web media evidence directory is readable. Files count: {len(os.listdir(web_media_dir))}")
    else:
        log.append(f"Web media evidence directory is NOT readable or does not exist.")

    # Write log to file
    with open('/home1/headwayc/poe_backend/media_status.txt', 'w') as f:
        f.write("\n".join(log))
    print("Done")

if __name__ == '__main__':
    main()
