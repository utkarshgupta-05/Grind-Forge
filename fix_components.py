import os
import re

file_path = 'css/components.css'
with open(file_path, 'rb') as f:
    raw = f.read()

# detect encoding
if raw.startswith(b'\xff\xfe'):
    content = raw.decode('utf-16')
else:
    content = raw.decode('utf-8')

old_rule_2 = '''.note-card,
.focus-session-item {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  position: relative;
  overflow: hidden;
  border-left: 4px solid var(--focus-accent); /* purple left border accent */
}'''

new_rule = '''.note-card,
.focus-session-item {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  position: relative;
  overflow: hidden;
}

.note-card {
  border-left: 4px solid var(--notes-accent);
}

.focus-session-item {
  border-left: 4px solid var(--focus-accent);
}'''

if old_rule_2 in content:
    content = content.replace(old_rule_2, new_rule)
else:
    content = re.sub(r'\.note-card,\s*\.focus-session-item\s*\{\s*[^}]*border-left:\s*4px\s*solid\s*var\(--focus-accent\);[^}]*\}', new_rule, content)

override_rule = 'body[data-page="tasks.html"] .stat-card .stat-value { color: var(--tasks-accent); }'
if override_rule not in content:
    expenses_override = 'body[data-page="expenses.html"] .stat-card .stat-value { color: var(--expense-accent); }'
    content = content.replace(expenses_override, override_rule + '\n' + expenses_override)

expense_btn_style = '''
.add-expense-trigger-btn {
  background-color: var(--expense-accent);
  color: #fff;
  box-shadow: 0 2px 8px var(--expense-accent-glow);
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.add-expense-trigger-btn:hover {
  background-color: var(--expense-accent-hover, var(--expense-accent));
  box-shadow: 0 4px 16px var(--expense-accent-glow);
}'''

if '.add-expense-trigger-btn' not in content:
    task_btn_rule = '.add-task-trigger-btn {'
    idx = content.find(task_btn_rule)
    if idx != -1:
        content = content[:idx] + expense_btn_style.strip() + '\n\n' + content[idx:]
    else:
        content += '\n' + expense_btn_style

content = re.sub(r'\.stat-card\s*h3,\s*\.stat-card\s*h4\s*\{', '.stat-card h3 {', content)
content = re.sub(r'\.stat-card\s*h4\s*\{[^}]*\}\n?', '', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
