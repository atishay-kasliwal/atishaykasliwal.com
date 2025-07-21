import os
import shutil

def should_copy(filename):
    """Return True if the file is a corrected n4 or mask file."""
    fname = filename.lower()
    return 'corrected_n4' in fname or 'mask' in fname

def copy_filtered_files(src_root, dst_root):
    for dirpath, dirnames, filenames in os.walk(src_root):
        # Compute the relative path from the source root
        rel_path = os.path.relpath(dirpath, src_root)
        # Compute the corresponding destination directory
        dst_dir = os.path.join(dst_root, rel_path)
        os.makedirs(dst_dir, exist_ok=True)
        for fname in filenames:
            if should_copy(fname):
                src_file = os.path.join(dirpath, fname)
                dst_file = os.path.join(dst_dir, fname)
                shutil.copy2(src_file, dst_file)
                print(f"Copied: {src_file} -> {dst_file}")

if __name__ == "__main__":
    src_root = input("Enter the path to the source directory: ").strip()
    dst_root = "filtered"
    copy_filtered_files(src_root, dst_root)
    print("Done! All filtered files are in the 'filtered' directory.") 