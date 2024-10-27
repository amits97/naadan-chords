/**
 * Util functions
 **/

import { del, get, post, put } from "aws-amplify/api";

// Wrapper around v6 Amplify API functions to preserve v5 calling style.
export const API = {
  get: async (apiName, path) => {
    const request = get({ apiName, path });
    const { body } = await request.response;
    const json = await body.json();
    return json;
  },
  post: async (apiName, path, options) => {
    const request = post({ apiName, path, options });
    const { body } = await request.response;
    const json = await body.json();
    return json;
  },
  put: async (apiName, path, options) => {
    const request = put({ apiName, path, options });
    const { body } = await request.response;
    const json = await body.json();
    return json;
  },
  del: async (apiName, path) => {
    return del({ apiName, path }).response;
  },
};

export function slugify(text) {
  if (text) {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(/[^\w-]+/g, "") // Remove all non-word chars
      .replace(/--+/g, "-") // Replace multiple - with single -
      .replace(/^-+/, "") // Trim - from start of text
      .replace(/-+$/, ""); // Trim - from end of text
  }
}

export function capitalizeFirstLetter(string) {
  return string
    .toLowerCase()
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join(" ");
}

export function querystring(name, url = window.location.href) {
  name = name.replace(/[[]]/g, "\\$&");

  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)", "i");
  const results = regex.exec(url);

  if (!results) {
    return null;
  }
  if (!results[2]) {
    return "";
  }

  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

export function safeStringNullOrEmpty(string, prefix) {
  if (string === null || string === "") {
    return "";
  } else {
    return prefix ? ` ${prefix} ` + string : string;
  }
}

export function base64toBlob(b64Data, contentType = "", sliceSize = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
}

export function parseLinksToHtml(content) {
  const urlRegex = /^[^"]?(https?:\/\/[^\s]+)/gim;
  return content.replace(urlRegex, (match, p1) => {
    return `<a href="${p1}" target="_blank">${p1}</a>`;
  });
}

export function generateDelayPromise(timeout, callback) {
  return new Promise(function (resolve) {
    setTimeout(resolve.bind(null, callback), timeout);
  });
}

export function getNthOccurenceIndex(str, char, n) {
  return str.split(char).slice(0, n).join(char).length;
}
