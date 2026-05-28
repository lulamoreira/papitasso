import requests
import urllib.parse
import time

files = [
    "Gao_Lin_2011.jpg"
]

headers = {
    'User-Agent': 'SoccerImageResearcher/1.0 (contact: your-email@example.com)'
}

def get_direct_url(filename):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles=File:{urllib.parse.quote(filename)}&prop=imageinfo&iiprop=url|size&format=json"
    try:
        r = requests.get(url, headers=headers)
        r.raise_for_status()
        data = r.json()
        pages = data.get("query", {}).get("pages", {})
        for p in pages.values():
            if "imageinfo" in p:
                info = p["imageinfo"][0]
                return info.get("url"), info.get("width")
    except Exception as e:
        pass
    return None, None

for f in files:
    direct_url, width = get_direct_url(f)
    print(f"{width}px - {direct_url}")
