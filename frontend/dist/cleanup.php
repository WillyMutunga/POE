<?php
// One-time cleanup script to delete orphaned virtualenv
// DELETE THIS FILE IMMEDIATELY AFTER USE

$target = '/home1/headwayc/virtualenv/poe_backend';
$secret = isset($_GET['key']) ? $_GET['key'] : '';

// Simple security check - only runs with correct key
if ($secret !== 'poe2026cleanup') {
    die('Unauthorized');
}

function deleteDir($dir) {
    if (!is_dir($dir)) {
        return "Directory does not exist: $dir";
    }
    
    $files = array_diff(scandir($dir), array('.','..'));
    foreach ($files as $file) {
        $path = "$dir/$file";
        if (is_dir($path)) {
            deleteDir($path);
        } else {
            unlink($path);
        }
    }
    return rmdir($dir) ? "Deleted: $dir" : "Failed to delete: $dir";
}

echo "<pre>";
echo "Checking: $target\n";
if (is_dir($target)) {
    echo "Found directory. Deleting...\n";
    echo deleteDir($target) . "\n";
    
    // Verify
    if (!is_dir($target)) {
        echo "SUCCESS: Directory deleted!\n";
    } else {
        echo "FAILED: Directory still exists.\n";
    }
} else {
    echo "Directory does not exist (already deleted or wrong path).\n";
    
    // List what's in virtualenv
    $parent = '/home1/headwayc/virtualenv';
    if (is_dir($parent)) {
        echo "Contents of $parent:\n";
        $items = scandir($parent);
        foreach ($items as $item) {
            echo "  - $item\n";
        }
    } else {
        echo "virtualenv folder itself doesn't exist.\n";
    }
}
echo "</pre>";
?>
