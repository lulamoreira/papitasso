import requests
import urllib.parse

files = [
    "Brazil_national_team_1970.jpg",
    "Brazil_vs_Belgium_2018_World_Cup_02.jpg",
    "20180610_FIFA_Friendly_Match_Austria_vs._Brazil_Gruppenfoto_Brasilien_850_0016.jpg",
    "Argentina_3-3_Francia_-_Copa_Mundial_2022_-_Montiel_patea_el_penal_de_la_victoria.jpg",
    "Argentina_vs_Nigeria_(2018_football_World_cup).jpg",
    "Hinchas_argentinos_durante_el_partido_Argentina-México.jpg",
    "Spain_national_football_team_Euro_2012_final.jpg",
    "ESP-RUS_(24).jpg",
    "Spain_Euro_08_celebration_3.jpg",
    "EURO_2020_FINAL_Wembley_Stadium_London_11_July_2021_(d).jpg",
    "2018_World_Cup_Semifinal_-_England_v_Croatia.jpg",
    "2022_FIFA_World_Cup_England_6–2_Iran_-_(10).jpg",
    "Euro_2016_Cristiano_Ronaldo.jpg",
    "Portugal-Morocco_by_soccer.ru_12.jpg",
    "2022_FIFA_World_Cup_Match_32,_Portugal_v_Uruguay_-_01.jpg",
    "USMNT_vs._Trinidad_and_Tobago_(48124885026).jpg",
    "USA_v_Algeria_World_Cup_Match.jpg",
    "USA_supporters_USA_vs_Japan_2015_WWC_Final_2015-07-05_(19487204716)_(2).jpg",
    "Brazil_and_Colombia_match_at_the_FIFA_World_Cup_2014-07-04_(28).jpg",
    "Poland_vs_Colombia_2018_World_Cup_33.jpg",
    "Despedida_de_la_Selección_Colombia_en_Estadio_Nemesio_Camacho_El_Campín_de_noche.jpg",
    "2022_FIFA_World_Cup_Korea_Uruguay_02.jpg",
    "Uruguay_-_Costa_Rica_FIFA_World_Cup_2014_(9).jpg",
    "URUGUAY_5_–_PANAMÁ_0_-_220611-7072-jikatu.jpg",
    "China_National_Team_(2517964102).jpg",
    "China_national_football_team_2016.jpg",
    "Chinese_national_football_team_2011.jpg",
    "Campeonato_Carioca_-_Fluminense_x_Flamengo_-_Paulo_Victor_faz_uma_defesa.jpg",
    "Cruzeiro_x_Flamengo,_Final_de_la_Copa_do_Brasil_2017_.jpg",
    "Palmeiras_x_Flamengo_-_Libertadores_-_Final_-_Torcida.jpg"
]

def get_direct_url(filename):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles=File:{urllib.parse.quote(filename)}&prop=imageinfo&iiprop=url|size&format=json"
    r = requests.get(url)
    data = r.json()
    pages = data.get("query", {}).get("pages", {})
    for p in pages.values():
        info = p.get("imageinfo", [{}])[0]
        return info.get("url"), info.get("width")
    return None, None

for f in files:
    direct_url, width = get_direct_url(f)
    print(f"{direct_url}")
