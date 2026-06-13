import os

with open('dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

if 'css/pages/dashboard.css' not in content:
    content = content.replace('<link rel="stylesheet" href="css/components.css" />', '<link rel="stylesheet" href="css/components.css" />\n  <link rel="stylesheet" href="css/pages/dashboard.css" />')

replacements = {
    'style="padding: 0; overflow: hidden; height: 100%;"': 'class="form-card widget-card-dashboard"',
    'style="padding: 20px 24px; border-bottom: 1px solid var(--card-border); background-color: var(--surface-elevated);"': 'class="widget-header-dashboard"',
    'class="split-section-title" style="margin: 0; color: var(--accent);"': 'class="split-section-title widget-title-accent"',
    'class="split-section-title" style="margin: 0; color: var(--analytics-accent);"': 'class="split-section-title widget-title-analytics"',
    'style="border: none; box-shadow: none; background: transparent;"': 'class="widget-list-container"',
    'style="border: none; box-shadow: none; background: transparent; padding: 20px;"': 'class="widget-list-container-padded"'
}

for old, new_ in replacements.items():
    if 'class="form-card widget-card-dashboard"' in new_:
        content = content.replace('class="recent-activity-section form-card" ' + old, 'class="recent-activity-section ' + new_.replace('class="', '')).replace('class="productivity-insights-section form-card" ' + old, 'class="productivity-insights-section ' + new_.replace('class="', ''))
    elif 'class="split-section-title' in new_:
        content = content.replace(old, new_)
    else:
        content = content.replace(' ' + old, ' ' + new_)

with open('dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
