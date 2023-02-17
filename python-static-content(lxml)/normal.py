# from contextlib import nullcontext
import lxml.html
import requests
import re


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
    print('url : ' + event['url'])
    response = requests.get(event['url'], stream=True)
    print("response code : " + str(response.status_code))
    response.raw.decode_content = True
    root = lxml.html.parse(response.raw)
    arr = []
    count = 0
    words = event['q'].lower().split()
    for elem in root.xpath(event['wrapper']):
        title = elem.xpath(event['title'])
        if len(title) > 0:
            title = title[0].text_content().lower()
            print(title)
            title = specialCharacterReplace(title)
            print(title)
            outOfStock = elem.xpath(
                event['out_of_stock']) if event['out_of_stock'] else []
            if not outOfStock:
                # print(title)
                matched = True
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
                    arr.append(title)
    print('count : ' + str(count))


event = {
  "q": "golf",
  "url": "https://www.briadiscgolf.com/search-results-page/golf",
  "wrapper": "div#search_res_container>div>div>div.search_res_item_snippet>div.search_res_item_title",
  "title": "",
  "out_of_stock": "",
  "not": ""
}
search(event)
