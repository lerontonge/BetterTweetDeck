import each from 'promise-each';
import timestampOnElement from './util/timestamp';
import { send as sendMessage } from './util/messaging';
import * as Thumbnails from './util/thumbnails';
import * as Templates from './util/templates';
import * as Usernames from './util/usernames';

import { $, TIMESTAMP_INTERVAL, on, sendEvent } from './util/util';

let settings;
const COLUMNS_MEDIA_SIZES = new Map();

sendMessage({ action: 'get_settings' }, (response) => {
  settings = response.settings;
});

const scriptEl = document.createElement('script');
scriptEl.src = chrome.extension.getURL('js/inject.js');
document.head.appendChild(scriptEl);

function refreshTimestamps() {
  if (!$('.js-timestamp')) {
    return;
  }

  $('.js-timestamp').forEach((jsTimstp) => {
    const d = jsTimstp.getAttribute('data-time');
    $('a, span', jsTimstp).forEach((el) => timestampOnElement(el, d));
  });
}

function tweakClassesFromVisualSettings() {
  const enabledClasses = Object.keys(settings.css)
                        .filter((key) => settings.css[key])
                        .map((cl) => `btd__${cl}`);

  document.body.classList.add(...enabledClasses);

  if (settings.no_hearts) {
    document.body.classList.remove('hearty');
  }
}

function expandURL(url, node) {
  const anchors = $(`a[href="${url.url}"]`, node);

  if (!settings.no_tco || !anchors) {
    return;
  }

  anchors.forEach((anchor) => anchor.setAttribute('href', url.expanded_url));
}

function thumbnailFromSingleURL(url, node, mediaSize) {
  const anchors = $(`a[href="${url.expanded_url}"]`, node);

  if (!anchors || !mediaSize) {
    return Promise.resolve();
  }

  const anchor = anchors[0];

  if (anchor.dataset.urlScanned === 'true' || $('.js-media', node)) {
    return Promise.resolve();
  }

  anchor.setAttribute('data-url-scanned', 'true');

  Thumbnails.thumbnailFor(url.expanded_url).then((data) => {
    if (!data) {
      return;
    }

    const tbUrl = data.thumbnail_url || data.url;
    const html = Templates.previewTemplate(tbUrl, url.expanded_url, mediaSize);
    const modalHtml = Templates.modalTemplate(tbUrl, url.expanded_url, 'image');

    if (mediaSize === 'large') {
      $('.tweet.js-tweet', node)[0].insertAdjacentHTML('afterend', html);
    } else {
      $('.tweet-body p', node)[0].insertAdjacentHTML('afterend', html);
    }

    $('.js-media-image-link', node)[0].addEventListener('click', (e) => {
      e.preventDefault();


      const tweetKey = node.getAttribute('data-key');
      const colKey = node.closest('[data-column]').getAttribute('data-column');

      sendEvent('getOpenModalTweetHTML', { tweetKey, colKey, modalHtml });
    });
  });

  return Promise.resolve();
}

function thumbnailsFromURLs(urls, node, mediaSize) {
  return Promise.resolve(urls).then(each((url) => {
    if (url.type || url.sizes || Thumbnails.ignoreUrl(url.expanded_url)) {
      return false;
    }

    return thumbnailFromSingleURL(url, node, mediaSize);
  }));
}

function tweetHandler(tweet, columnKey, parent) {
  if (!parent) {
    if (!$(`.js-column[data-column="${columnKey}"]`)) console.log(tweet, columnKey);
    parent = $(`.js-column[data-column="${columnKey}"]`)[0];
  }

  let nodes = $(`.stream-item[data-key="${tweet.id}"]`, parent);

  if (!nodes && tweet.messageThreadId) {
    nodes = $(`.stream-item[data-key="${tweet.messageThreadId}"]`, parent);
  }

  const mediaSize = COLUMNS_MEDIA_SIZES.get(columnKey);

  nodes.forEach((node) => {
    let urlsToChange = [];

    // Timestamps:
    // $('time > *', node).forEach((el) => timestampOnElement(el, tweet.created));
    if ($('time > *', node)) {
      $('time > *', node).forEach((el) => timestampOnElement(el, tweet.created));
    }

    // Usernames:
    // If it has `targetTweet` then it's an activity and we need to change both the desc and the tweet if displayed
    if (tweet.targetTweet) {
      if (!tweet.id.startsWith('mention_') && !tweet.id.startsWith('quoted_tweet_')) {
        Usernames.format({
          node,
          user: tweet.sourceUser,
          fSel: '.activity-header .account-link',
        });
      }

      Usernames.format({
        node: $('.js-tweet > .tweet-header', node)[0],
        user: tweet.targetTweet.user,
        fSel: '.fullname',
        uSel: '.username',
      });
    } else if (tweet.retweetedStatus) {
      Usernames.format({
        node,
        user: tweet.user,
        fSel: '.tweet-context .nbfc > a[rel=user]',
      });

      Usernames.format({
        node,
        user: tweet.retweetedStatus.user,
        fSel: '.tweet-header .fullname',
        uSel: '.tweet-header .username',
      });
    } else if (tweet.user && !tweet.retweetedStatus) {
      Usernames.format({
        node,
        user: tweet.user,
        fSel: '.fullname',
        uSel: '.username',
      });
    } else if (tweet.messages && !tweet.name) {
      if (tweet.type === 'ONE_TO_ONE') {
        Usernames.format({
          node,
          user: tweet.participants[0],
          fSel: '.link-complex b',
          uSel: '.username',
        });
      } else if (tweet.type === 'GROUP_DM') {
        Usernames.formatGroupDM({
          node,
          participants: tweet.participants,
          fSel: '.tweet-header .account-link > b',
        });
      }
    }

    if (tweet.quotedTweet) {
      Usernames.format({
        node,
        user: tweet.quotedTweet.user,
        fSel: '.quoted-tweet .tweet-header .fullname',
        uSel: '.quoted-tweet .tweet-header .username',
      });
    }


    // Urls:
    // If it got entities, it's a tweet
    if (tweet.entities) {
      urlsToChange = [...tweet.entities.urls, ...tweet.entities.media];
    } else if (tweet.targetTweet && tweet.targetUser) {
      // If it got targetTweet it's an activity on a tweet
      urlsToChange = [...tweet.targetTweet.entities.urls, ...tweet.targetTweet.entities.media];
    }

    if (urlsToChange.length > 0) {
      // We expand URLs
      urlsToChange.forEach(url => expandURL(url, node));

      const urlForThumbnail = urlsToChange.filter(url => !url.id).pop();

      if (!urlForThumbnail) {
        return;
      }
      // We pass a single URL even though the code is ready to handle multiples URLs
      // Maybe we could have a gallery or something when we have different URLs
      thumbnailsFromURLs([urlForThumbnail], node, mediaSize);
    }
  });
}

// Prepare to know when TD is ready
on('BTDC_ready', () => {
  tweakClassesFromVisualSettings();
  // Refresh timestamps once and then set the interval
  refreshTimestamps();
  setInterval(refreshTimestamps, TIMESTAMP_INTERVAL);

  sendEvent('fromContent', { foo: 'bar' });
});

on('BTDC_gotChirpForColumn', (ev, data) => {
  const { chirp, colKey } = data;

  tweetHandler(chirp, colKey);
});

on('BTDC_gotMediaGalleryChirpHTML', (ev, data) => {
  const { markup, modalHtml } = data;

  const openModal = $('#open-modal')[0];
  openModal.innerHTML = modalHtml.replace('<div class="js-med-tweet med-tweet"></div>', `<div class="js-med-tweet med-tweet">${markup}</div>`);
  openModal.style.display = 'block';
});

on('BTDC_uiDetailViewOpening', (ev, data) => {
  const detail = data;
  const tweets = detail.chirpsData;

  tweets.forEach((tweet) => tweetHandler(tweet, detail.columnKey));
});

on('BTDC_columnMediaSizeUpdated', (ev, data) => {
  const { id, size } = data;

  COLUMNS_MEDIA_SIZES.set(id, size);
});

on('BTDC_columnsChanged', (ev, data) => {
  const colsArray = data;

  if (COLUMNS_MEDIA_SIZES.size !== colsArray.length) {
    COLUMNS_MEDIA_SIZES.clear();
  }

  colsArray.filter(col => col.id)
           .forEach(col => {
             COLUMNS_MEDIA_SIZES.set(col.id, col.mediaSize);
           });
});
