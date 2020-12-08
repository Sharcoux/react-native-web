/**
 * Copyright (c) Nicolas Gallagher.
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/************* Listeners management ******************/
const listeners: Array<() => boolean | null | undefined> = [];
const addEventListener = (event: 'hardwareBackPress', listener) => {
  listeners.unshift(listener);
  return { remove: () => removeEventListener(event, listener) };
};

const removeEventListener = (event: 'hardwareBackPress', listener) => {
  listeners.splice(listeners.indexOf(listener), 1);
};

/************* History management ******************/
let lastShown = 0;
// We create an id for this app history
const id = "backHandler" + Date.now();
const push = window.history.pushState;
// Each new entry in the history will receive a backHandlerIndex.
window.history.pushState = (data, title, url) => {
  lastShown++;
  try {
    data.backHandlerIndex = lastShown;
    push.apply(window.history, [data, title, url]);
  } catch (err) {
    push.apply(window.history, [{ [id]: lastShown }, title, url]);
  }
};

// When poping an entry from the history, we prevent moving back if a listener prevented it
window.addEventListener("popstate", () => {
  // We retrieve the index of the entry being poped
  const showing = (window.history.state || { [id]: 0 })[id] || 0;
  const backButtonPressed = showing <= lastShown; // If the index decreased, we are moving back.
  lastShown = showing;
  // If we pressed the back button
  if (backButtonPressed) {
    const handled = listeners.find((l) => l());
    // We prevent the page to be moved back
    if (handled) {
      window.history.forward();
    }
    // When we press 'back' on the initial state, we leave the app.
    else if (showing === 0) {
      console.log("leaving the app");
      window.history.back();
    }
  }
});

// Hack for Chrome. See this issue: https://stackoverflow.com/questions/64001278/history-pushstate-on-chrome-is-being-ignored?noredirect=1#comment113174647_64001278
const onFirstPress = () => {
  // After the first interaction with the app, we create an initial state in the history. This will enable the back button for the app.
  if (lastShown === 0) window.history.pushState(null, "", window.location.href);
};
window.addEventListener("focusin", onFirstPress);

/************* Back Handler API ******************/

const exitApp = () => {
  listeners.length = 0;
  window.history.previous();
};

export default {
  addEventListener,
  exitApp,
  removeEventListener
};
