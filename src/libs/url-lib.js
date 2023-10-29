export function getUrlParameter(name) {
  name = name
    .replace(/\\/g, "\\\\")
    .replace(/[[]/g, "\\[")
    .replace(/[\]]/g, "\\]");
  let regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  let results = regex.exec(window.location.search);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

export function insertUrlParam(key, value) {
  if (window.history.pushState) {
    let searchParams = new URLSearchParams(window.location.search);
    if (value !== undefined) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
    let newurl = `${window.location.protocol}//${window.location.host}${
      window.location.pathname
    }${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    window.history.pushState({ path: newurl }, "", newurl);
  }
}
