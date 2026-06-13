import os
import re

def process_file(filename, remove_colon=True):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to target only h4 tags that are inside stat-cards, but in these specific files, all h4 tags are actually just the stat card labels.
    # To be safe, we'll replace `<h4` with `<h3` and `</h4>` with `</h3>`
    
    if remove_colon:
        content = re.sub(r'<h4([^>]*)>\s*(.*?)\s*:\s*</h4>', r'<h3\1>\2</h3>', content)
        # Fallback for any without colon
        content = re.sub(r'<h4([^>]*)>\s*(.*?)\s*</h4>', r'<h3\1>\2</h3>', content)
    else:
        content = re.sub(r'<h4([^>]*)>\s*(.*?)\s*</h4>', r'<h3\1>\2</h3>', content)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('tasks.html', remove_colon=True)
process_file('notes.html', remove_colon=True)
process_file('expenses.html', remove_colon=False)

print('Done')
