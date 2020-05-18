window.addEventListener('DOMContentLoaded', () => {
  let isfetched = false;
  let datas;
  let isXml = true;
  let searchPath = CONFIG.path;
  const path = CONFIG.root + searchPath;
  const input = document.getElementById('search-input');
  const resultContent = document.getElementById('search-result');
  const unescapeHtml = html => {
    return String(html)
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, '\'')
      .replace(/&#x3A;/g, ':')
      .replace(/&#(\d+);/g, (m, p) => {
        return String.fromCharCode(p);
      })
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  };
  const getIndexByWord = (word, text, caseSensitive) => {
    let wordLen = word.length;
    if (wordLen === 0) return [];
    let startPosition = 0;
    let position = [];
    let index = [];
    if (!caseSensitive) {
      text = text.toLowerCase();
      word = word.toLowerCase();
    }
    while ((position = text.indexOf(word, startPosition)) > -1) {
      index.push({
        position: position,
        word: word
      });
      startPosition = position + wordLen;
    }
    return index;
  };
  const mergeIntoSlice = (start, end, index, searchText) => {
    let item = index[index.length - 1];
    let position = item.position;
    let word = item.word;
    let hits = [];
    let searchTextCountInSlice = 0;
    while (position + word.length <= end && index.length !== 0) {
      if (word === searchText) {
        searchTextCountInSlice++;
      }
      hits.push({
        position: position,
        length: word.length
      });
      let wordEnd = position + word.length;
      index.pop();
      while (index.length !== 0) {
        item = index[index.length - 1];
        position = item.position;
        word = item.word;
        if (wordEnd > position) {
          index.pop();
        } else {
          break;
        }
      }
    }
    return {
      hits: hits,
      start: start,
      end: end,
      searchTextCount: searchTextCountInSlice
    };
  };
  const highlightKeyword = (text, slice) => {
    let result = '';
    let prevEnd = slice.start;
    slice.hits.forEach(hit => {
      result += text.substring(prevEnd, hit.position);
      let end = hit.position + hit.length;
      result += `<b class="search-keyword">${text.substring(hit.position, end)}</b>`;
      prevEnd = end;
    });
    result += text.substring(prevEnd, slice.end);
    return result;
  };

  const inputEventFunction = () => {
    let searchText = input.value.trim().toLowerCase();
    let keywords = searchText.split(/[-\s]+/);
    if (keywords.length > 1) {
      keywords.push(searchText);
    }
    let resultItems = [];
    if (searchText.length > 0) {
      datas.forEach(data => {
        if (!data.title) return;
        let searchTextCount = 0;
        let title = data.title.trim();
        let titleInLowerCase = title.toLowerCase();
        let content = data.content ? data.content.trim().replace(/<[^>]+>/g, '') : '';
        content = unescapeHtml(content);
        let contentInLowerCase = content.toLowerCase();
        let articleUrl = decodeURIComponent(data.url).replace(/\/{2,}/g, '/');
        let indexOfTitle = [];
        let indexOfContent = [];
        keywords.forEach(keyword => {
          indexOfTitle = indexOfTitle.concat(getIndexByWord(keyword, titleInLowerCase, false));
          indexOfContent = indexOfContent.concat(getIndexByWord(keyword, contentInLowerCase, false));
        });
        if (indexOfTitle.length > 0 || indexOfContent.length > 0) {
          let hitCount = indexOfTitle.length + indexOfContent.length;
          [indexOfTitle, indexOfContent].forEach(index => {
            index.sort((itemLeft, itemRight) => {
              if (itemRight.position !== itemLeft.position) {
                return itemRight.position - itemLeft.position;
              }
              return itemLeft.word.length - itemRight.word.length;
            });
          });
          let slicesOfTitle = [];
          if (indexOfTitle.length !== 0) {
            let tmp = mergeIntoSlice(0, title.length, indexOfTitle, searchText);
            searchTextCount += tmp.searchTextCountInSlice;
            slicesOfTitle.push(tmp);
          }
          let slicesOfContent = [];
          while (indexOfContent.length !== 0) {
            let item = indexOfContent[indexOfContent.length - 1];
            let position = item.position;
            let word = item.word;
            let start = position - 20;
            let end = position + 80;
            if (start < 0) {
              start = 0;
            }
            if (end < position + word.length) {
              end = position + word.length;
            }
            if (end > content.length) {
              end = content.length;
            }
            let tmp = mergeIntoSlice(start, end, indexOfContent, searchText);
            searchTextCount += tmp.searchTextCountInSlice;
            slicesOfContent.push(tmp);
          }
          slicesOfContent.sort((sliceLeft, sliceRight) => {
            if (sliceLeft.searchTextCount !== sliceRight.searchTextCount) {
              return sliceRight.searchTextCount - sliceLeft.searchTextCount;
            } else if (sliceLeft.hits.length !== sliceRight.hits.length) {
              return sliceRight.hits.length - sliceLeft.hits.length;
            }
            return sliceLeft.start - sliceRight.start;
          });
          let upperBound = parseInt(1, 10);
          if (upperBound >= 0) {
            slicesOfContent = slicesOfContent.slice(0, upperBound);
          }
          let resultItem = '';
          if (slicesOfTitle.length !== 0) {
            resultItem += `<li><a href="${articleUrl}" class="search-result-title">${highlightKeyword(title, slicesOfTitle[0])}</a>`;
          } else {
            resultItem += `<li><a href="${articleUrl}" class="search-result-title">${title}</a>`;
          }
          slicesOfContent.forEach(slice => {
            resultItem += `<a href="${articleUrl}"><p class="search-result">${highlightKeyword(content, slice)}...</p></a>`;
          });
          resultItem += '</li>';
          resultItems.push({
            item: resultItem,
            searchTextCount: searchTextCount,
            hitCount: hitCount,
            id: resultItems.length
          });
        }
      });
    }
    if (keywords.length === 1 && keywords[0] === '') {
      resultContent.innerHTML = '<div id="no-result"><i class="fa fa-search fa-5x"></i></div>';
    } else if (resultItems.length === 0) {
      resultContent.innerHTML = '<div id="no-result"><i class="fa fa-frown-o fa-5x"></i></div>';
    } else {
      resultItems.sort((resultLeft, resultRight) => {
        if (resultLeft.searchTextCount !== resultRight.searchTextCount) {
          return resultRight.searchTextCount - resultLeft.searchTextCount;
        } else if (resultLeft.hitCount !== resultRight.hitCount) {
          return resultRight.hitCount - resultLeft.hitCount;
        }
        return resultRight.id - resultLeft.id;
      });
      let searchResultList = '<ul class="search-result-list">';
      resultItems.forEach(result => {
        searchResultList += result.item;
      });
      searchResultList += '</ul>';
      resultContent.innerHTML = searchResultList;
      window.pjax && window.pjax.refresh(resultContent);
    }
  };
  const fetchData = callback => {
    fetch(path)
      .then(response => response.text())
      .then(res => {
        isfetched = true;
        datas = isXml ? [...new DOMParser().parseFromString(res, 'text/xml').querySelectorAll('entry')].map(element => {
          return {
            title: element.querySelector('title').innerHTML,
            content: element.querySelector('content').innerHTML,
            url: element.querySelector('url').innerHTML
          };
        }) : JSON.parse(res);
        document.querySelector('.search-pop-overlay').innerHTML = '';
        document.body.style.overflow = '';
        if (callback) {
          callback();
        }
      });
  };
  const proceedSearch = () => {
    document.body.style.overflow = 'hidden';
    document.querySelector('.search-pop-overlay').style.display = 'block';
    document.querySelector('.popup').style.display = 'block';
    document.getElementById('search-input').focus();
  };
  const searchFunc = () => {
    document.querySelector('.search-pop-overlay').style.display = '';
    document.querySelector('.search-pop-overlay').innerHTML = '<div class="search-loading-icon"><i class="fa fa-spinner fa-pulse fa-5x fa-fw"></i></div>';
    fetchData(proceedSearch);
  };
  input.addEventListener('input', inputEventFunction);
  document.querySelector('.popup-trigger').addEventListener('click', () => {
    if (isfetched === false) {
      searchFunc();
    } else {
      proceedSearch();
    }
  });
  const onPopupClose = () => {
    document.body.style.overflow = '';
    document.querySelector('.search-pop-overlay').style.display = 'none';
    document.querySelector('.popup').style.display = 'none';
  };
  document.querySelector('.search-pop-overlay').addEventListener('click', onPopupClose);
  document.querySelector('.popup-btn-close').addEventListener('click', onPopupClose);
  window.addEventListener('pjax:success', onPopupClose);
  window.addEventListener('keyup', event => {
    if (event.which === 27) {
      onPopupClose();
    }
  });
});