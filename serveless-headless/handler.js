'use strict';
const chromium = require('chrome-aws-lambda');

// multiple pages at once
module.exports.browser = (event, context, callback) => {
  let gResult = null;
  let gBrowser = null;
  let gError = null;
  const start = new Date().getTime();
  chromium.executablePath.then(executablePath => {
    return chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });
  })
  .then(browser => {
    gBrowser = browser;
    const pages = [];
    event.data.forEach(v => {
      const count = getPageCount(browser, v);
      pages.push(count);
    });
    return Promise.all(pages);
  }).then(result => {
    gResult = result;
  }).catch(error => {
    gError = error;
  }).finally(() => {
    if (gBrowser !== null) {
      gBrowser.close().finally(() => {
        if (gError) {
          console.log(gError);
          callback('Error occurred');
        } else {
          callback(null, { result: gResult });
        }
      });
    } else {
      if (gError) {
        console.log(gError);
        callback('Error occurred');
      } else {
        callback(null, { result: gResult });
      }
    }
  });
};

// search single page
module.exports.browseSingle = (event, context, callback) => {
  let gResult = null;
  let gBrowser = null;
  let gError = null;
  const start = new Date().getTime();
  chromium.executablePath.then(executablePath => {
    return chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });
  })
  .then(browser => {
    gBrowser = browser;
    return getPageCount(browser, event)
  }).then(result => {
    gResult = result;
  }).catch(error => {
    gError = error;
  }).finally(() => {
    if (gBrowser !== null) {
      gBrowser.close().finally(() => {
        if (gError) {
          console.log(gError);
          callback('Error occurred');
        } else {
          callback(null, { count: gResult });
        }
      });
    } else {
      if (gError) {
        console.log(gError);
        callback('Error occurred');
      } else {
        callback(null, { count: gResult });
      }
    }
  });
};

function getPageCount (browser, detail) {
  let url = detail.url;
  let keyword = detail.q;
  let wrapperXpath = detail.wrapper;
  let titleXpath = detail.title;
  let outOfStockXpath = detail.out_of_stock;
  let not = detail.not;
  let page = null;
  const browserPage = browser.newPage()
  .then(res => {
    page = res;
    return page.goto(url);
  })
  .then(res => {
    return page.addScriptTag({ url: 'https://code.jquery.com/jquery-3.2.1.min.js' });
  })
  .then(res => {
    return page.evaluate(data => {
      let count = 0;
      function specialCharacterReplace(str) {
        let chMap = {
          "ä" : "a",
          "Ä" : "a",
          "Å" : "a",
          "å" : "a",
          "Ö" : "o",
          "ö" : "o"
        }
        Object.keys(chMap).forEach(function(key){
          str = str.replace(key, chMap[key])
        })
        return str;
      }  
      $(data.wrapperXpath).each(function() {
        let title = $(this).find(data.titleXpath).text().trim();
        title = specialCharacterReplace(title);
        const oosElements = data.outOfStockXpath ? $(this).find(data.outOfStockXpath) : [];
        let nots = data.not ? data.not.replace(/\s/g, '|') : '';
        if (!oosElements.length && title) {
          data.keyword = specialCharacterReplace(data.keyword);
          const keywords = data.keyword.split(" ");
          let matched = true;
          for (let i = 0; i < keywords.length; i++) {
            const reg = new RegExp(`\\b${keywords[i]}\\b`, "i");
            if (!title.match(reg)) {
              matched = false;
              break;
            }
          }
          if (nots.length) {
            nots = specialCharacterReplace(nots)
            const notRegCheck = new RegExp(`\\b(?:${nots})\\b`, 'gmi');
            if (title.match(notRegCheck)) {
              matched = false;
            }
          }
          if (matched) {
            count += 1;
          }
        }
      });
      return count;
    }, { keyword: keyword, wrapperXpath: wrapperXpath, titleXpath: titleXpath, outOfStockXpath: outOfStockXpath, not: not});
    
  })
  .then(async(res) => {
    await page.close();
    return res;
  })
  .catch(err => {
    console.log('ERROR : ', err);
    return 0;
  });
  return browserPage;
}

// test search single page
module.exports.testBrowseSingle = (event, context, callback) => {
  let gResult = null;
  let gBrowser = null;
  let gError = null;
  const start = new Date().getTime();
  chromium.executablePath.then(executablePath => {
    return chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true
    });
  })
  .then(browser => {
    gBrowser = browser;
    return testGetPageCount(browser, JSON.parse(event.body))
  }).then(result => {
    gResult = result;
  }).catch(error => {
    gError = error;
  }).finally(() => {
    if (gBrowser !== null) {
      gBrowser.close().finally(() => {
        if (gError) {
          console.log(gError);
          callback('Error occurred');
        } else {
          callback(null, { count: gResult });
        }
      });
    } else {
      if (gError) {
        console.log(gError);
        callback('Error occurred');
      } else {
        callback(null, { count: gResult });
      }
    }
  });
};


// test get page count
function testGetPageCount (browser, detail) {
  let url = detail.url;
  let keyword = detail.q;
  let wrapperXpath = detail.wrapper;
  let titleXpath = detail.title;
  let outOfStockXpath = detail.out_of_stock;
  let not = detail.not;
  let page = null;
  const browserPage = browser.newPage()
  .then(res => {
    page = res;
    console.log('page goto')
    return page.goto(url);
  })
  .then(res => {
    console.log('add script')
    return page.addScriptTag({ url: 'https://code.jquery.com/jquery-3.2.1.min.js' });
  })
  .then(res => {
    console.log('evaluate')
    // setTimeout(function(){
      return page.evaluate(data => {
        console.log('evaluate')
        let count = 0;
        function specialCharacterReplace(str) {
          let chMap = {
            "ä" : "a",
            "Ä" : "a"
          }
          Object.keys(chMap).forEach(function(key){
            str = str.replace(key, chMap[key])
          })
          return str;
        }  
        $(data.wrapperXpath).each(function() {
          let title = $(this).find(data.titleXpath).text().trim();
          title = specialCharacterReplace(title);
          const oosElements = data.outOfStockXpath ? $(this).find(data.outOfStockXpath) : [];
          let nots = data.not ? data.not.replace(/\s/g, '|') : '';
          if (!oosElements.length && title) {
            data.keyword = specialCharacterReplace(data.keyword);
            const keywords = data.keyword.split(" ");
            let matched = true;
            for (let i = 0; i < keywords.length; i++) {
              const reg = new RegExp(`\\b${keywords[i]}\\b`, "i");
              if (!title.match(reg)) {
                matched = false;
                break;
              }
            }
            console.log(matched)
            if (nots.length) {
              nots = specialCharacterReplace(nots)
              const notRegCheck = new RegExp(`\\b(?:${nots})\\b`, 'gmi');
              if (title.match(notRegCheck)) {
                matched = false;
              }
            }
            if (matched) {
              count += 1;
            }
          }
        });
        console.log(count)
        return count;
      }, { keyword: keyword, wrapperXpath: wrapperXpath, titleXpath: titleXpath, outOfStockXpath: outOfStockXpath, not: not});
    // }, 1000)
    
    
  })
  .then(async(res) => {
    await page.close();
    return res;
  })
  .catch(err => {
    console.log('ERROR : ', err);
    return 0;
  });
  return browserPage;
}

