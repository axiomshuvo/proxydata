import os
import re

mockups_dir = 'mockups'
files = [f for f in os.listdir(mockups_dir) if f.endswith('.html')]

new_style = """<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  :root { --bg-obsidian: #09090b; --accent-cyan: #06b6d4; }
  body { background-color: var(--bg-obsidian); color: #f4f4f5; font-family: 'Inter', sans-serif; }
  .glass-panel { background: rgba(24, 24, 27, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); }
  .custom-radio { accent-color: #06b6d4; width: 16px; height: 16px; }
  .custom-select, .custom-input { background: rgba(9, 9, 11, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); color: white; padding: 10px 14px; border-radius: 8px; font-size: 14px; outline: none; width: 100%; transition: border-color 0.2s; }
  .custom-select:focus, .custom-input:focus { border-color: #06b6d4; }
  .field { background: rgba(9, 9, 11, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); color: white; transition: border-color 0.2s; }
  .field:focus { border-color: #06b6d4; outline: none; }
</style>"""

for file in files:
    filepath = os.path.join(mockups_dir, file)
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace style block
    content = re.sub(r'<style>.*?</style>', new_style, content, flags=re.DOTALL)
    
    # Replace classes
    content = content.replace('glass glow', 'glass-panel')
    content = content.replace('glass', 'glass-panel')
    
    # Remove the radial gradient from body if it's hardcoded in inline style (not common but just in case)
    content = re.sub(r'body \{ background: radial-gradient.*?; \}', '', content)
    
    with open(filepath, 'w') as f:
        f.write(content)
        
print("Updated all mockups to the new glass-panel aesthetic.")
