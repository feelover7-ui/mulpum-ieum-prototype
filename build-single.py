"""시안 사이트를 HTML 파일 하나(demo.html)로 묶는다. python3 build-single.py"""
import base64
from pathlib import Path

root = Path(__file__).parent
css = (root / 'app.css').read_text(encoding='utf-8')
data = (root / 'data.js').read_text(encoding='utf-8')
app = (root / 'app.js').read_text(encoding='utf-8')
icon = 'data:image/svg+xml;base64,' + base64.b64encode((root / 'favicon.svg').read_bytes()).decode()

# 파일 하나로 열 때는 옆 파일이 없으므로 로고는 내장, 개선안 문서는 웹 주소로
app = app.replace('src="favicon.svg"', 'src="' + icon + '"')
app = app.replace('href="proposal.html"', 'href="https://feelover7-ui.github.io/mulpum-ieum-prototype/proposal.html" target="_blank" rel="noopener"')
assert 'favicon.svg' not in app and 'href="proposal.html"' not in app

html = f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#147d64">
<title>물품이음 시연</title>
<link rel="icon" href="{icon}">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>
{css}
</style>
</head>
<body>
<div id="app" class="app"></div>
<div id="toast" class="toast" role="status" aria-live="polite" hidden></div>
<script>
{data}
</script>
<script>
{app}
</script>
</body>
</html>
'''
(root / 'demo.html').write_text(html, encoding='utf-8')
print('demo.html', len(html.encode()), 'bytes')
