import os

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

if 'css/pages/home.css' not in content:
    content = content.replace('<link rel="stylesheet" href="css/components.css" />', '<link rel="stylesheet" href="css/components.css" />\n  <link rel="stylesheet" href="css/pages/home.css" />')

replacements = {
    'style="padding: 0; overflow: hidden; border-left: 3px solid var(--tasks-accent); height: 100%;"': 'class="urgent-tasks form-card widget-card-tasks"',
    'style="padding: 0; overflow: hidden; border-left: 3px solid var(--focus-accent); height: 100%;"': 'class="form-card widget-card-focus"',
    'style="padding: 0; overflow: hidden; border-left: 3px solid var(--expense-accent); height: 100%;"': 'class="form-card widget-card-expense"',
    'style="padding: 0; overflow: hidden; border-left: 3px solid var(--notes-accent); height: 100%;"': 'class="form-card widget-card-notes"',

    'style="padding: 20px 24px; border-bottom: 1px solid var(--card-border); background-color: var(--surface-elevated); display: flex; justify-content: space-between; align-items: center;"': 'class="widget-header-flex"',
    'style="padding: 20px 24px; border-bottom: 1px solid var(--card-border); background-color: var(--surface-elevated);"': 'class="widget-header"',

    'class="split-section-title" style="margin: 0; color: var(--tasks-accent);"': 'class="split-section-title widget-title-tasks"',
    'class="split-section-title" style="margin: 0; color: var(--focus-accent);"': 'class="split-section-title widget-title-focus"',
    'class="split-section-title" style="margin: 0; color: var(--expense-accent);"': 'class="split-section-title widget-title-expense"',
    'class="split-section-title" style="margin: 0; color: var(--notes-accent);"': 'class="split-section-title widget-title-notes"',

    'style="padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;"': 'class="flex-col-gap-16"'
}

for old, new_ in replacements.items():
    if 'class="urgent-tasks form-card widget-card-tasks"' in new_:
        content = content.replace('class="urgent-tasks form-card" ' + old, new_)
    elif 'class="form-card widget-card-' in new_:
        content = content.replace('class="form-card" ' + old, new_)
    elif 'class="split-section-title' in new_:
        content = content.replace(old, new_)
    else:
        content = content.replace(' ' + old, ' ' + new_)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
