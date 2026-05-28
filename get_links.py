import requests
import urllib.parse
import time

files = [
    # Brazil
    "Brazil_and_Croatia_match_at_the_FIFA_World_Cup_2014-06-12_(02).jpg",
    "20180610_FIFA_Friendly_Match_Austria_vs._Brazil_Gruppenfoto_Brasilien_850_0016.jpg",
    "Seleção_brasileira_de_futebol_enfrenta_a_Alemanha_1039207-20.08.2016_frz-01-5.jpg",
    # Argentina
    "Argentina_3-3_Francia_-_Copa_Mundial_2022_-_Montiel_patea_el_penal_de_la_victoria.jpg",
    "Argentina_vs_Nigeria_(2018_football_World_cup).jpg",
    "Hinchas_argentinos_durante_el_partido_Argentina-México.jpg",
    # Spain
    "2010_FIFA_World_Cup_Spain_with_cup.JPG",
    "ESP-RUS_(24).jpg",
    "Spain_national_football_team_Euro_2012_trophy_02.jpg",
    # England
    "EURO_2020_FINAL_Wembley_Stadium_London_11_July_2021_(d).jpg",
    "2018_World_Cup_Semifinal_-_England_v_Croatia.jpg",
    "FWC_2018_-_Round_of_16_-_COL_v_ENG_-_Team_England_penalty_shootout.jpg",
    # Portugal
    "Euro_2016_Cristiano_Ronaldo.jpg",
    "Portugal-Morocco_by_soccer.ru_12.jpg",
    "Portugal_National_Football_Team_2018.jpg",
    # USA
    "USMNT_vs._Trinidad_and_Tobago_(48124885026).jpg",
    "USA_v_Algeria_World_Cup_Match.jpg",
    "USA_supporters_USA_vs_Japan_2015_WWC_Final_2015-07-05_(19487204716)_(2).jpg",
    # Colombia
    "Brazil_and_Colombia_match_at_the_FIFA_World_Cup_2014-07-04_(28).jpg",
    "Poland_vs_Colombia_2018_World_Cup_33.jpg",
    "Poland_v._Colombia_(42095441565).jpg",
    # Uruguay
    "2022_FIFA_World_Cup_Korea_Uruguay_02.jpg",
    "Uruguay_-_Costa_Rica_FIFA_World_Cup_2014_(9).jpg",
    "URUGUAY_5_–_PANAMÁ_0_-_220611-7072-jikatu.jpg",
    # China
    "China_National_Team_(2517964102).jpg",
    "Chinese_national_football_team_2011.jpg",
    "China_vs._Kazakhstan_2016_06_07.jpg",
    # Flamengo
    "Campeonato_Carioca_-_Fluminense_x_Flamengo_-_Paulo_Victor_faz_uma_defesa.jpg",
    "Saída_do_estádio_do_Maracanã_pós_jogo_do_Flamengo.jpg",
    "Palmeiras_x_Flamengo_-_Libertadores_-_Final_-_Torcida.jpg"
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

results = []
for f in files:
    direct_url, width = get_direct_url(f)
    if direct_url and width >= 1200:
        results.append(direct_url)
    else:
        results.append(f"FAILED OR SMALL: {f} ({width})")
    time.sleep(0.05)

for r in results:
    print(r)
