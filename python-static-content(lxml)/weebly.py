import requests
import re
import json

#new change

def specialCharacterReplace(str):
    chars = {
        "ä": "a",
        "Ä": "a",
        "Å": "a",
        "å": "a",
        "Ö": "o",
        "ö": "o"
    }
    for key in chars:
        str = str.replace(key, chars[key])
    return str.lower()


def search(event):
    header = json.loads(event['headers'])
    response = requests.get(event['ajax_url'], headers=header)
    data = response.json()
    count = 0
    words = event['q'].lower().split()

    # getting the data object
    for dataEl in event['wrapper']:
        data = data[dataEl]

    for elem in data:
        # getting the tile object
        for titleEl in event['title']:
            title = elem[titleEl]
        title = specialCharacterReplace(title)
        print(title)
        matched = True
        outOfStock = False
        if event['out_of_stock']:
            outOfStock = elem
            for el in event['out_of_stock']:
                outOfStock = outOfStock[el]
        if not outOfStock:
            for word in words:
                word = specialCharacterReplace(word)
                if not re.search(r'\b' + word + r'\b', title):
                    matched = False
                    break
                if event['not']:
                    nots = event['not'].lower()
                    nots = specialCharacterReplace(nots)
                    if re.search(r'\b(?:' + nots.replace(" ", "|") + r')\b', title):
                        matched = False
            if matched:
                count += 1
    print(count)
    return {"count": count}


event = {
  "q": "comet",
  "ajax_url": "https://cdn5.editmysite.com/app/store/api/v18/editor/users/128863395/sites/228160305121780493/products?page=1&per_page=8&sort_by=term_position&sort_order=asc&q=comet&autocomplete=true&excluded_fulfillment=dine_in",
  "wrapper": ["data"],
  "title": ["name"],
  "out_of_stock": ["badges","out_of_stock"],
  "not": "",
  "headers": '{"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8", "Referer": "http://www.wikipedia.org/", "Connection": "keep-alive", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36", "Accept-Language": "en-US,en;q=0.8"}'
}
search(event)