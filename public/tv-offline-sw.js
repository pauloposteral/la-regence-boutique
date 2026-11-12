/* La Régence TV — offline media serving for the service worker (Task 2).
 * Plain script loaded with importScripts("/tv-offline-sw.js"). It mirrors the URL
 * allowlist of src/lib/tvOffline.ts (a shared test table keeps both identical) and
 * serves only full validated files that the committed manifest lists as both ready
 * and eligible. It never writes media, never caches partial 206 responses and never
 * touches other Supabase/API/auth requests. */
(function (scope) {
  "use strict";
  var MEDIA_CACHE = "lr-tv-media-v1";
  var SNAPSHOT_CACHE = "lr-tv-public-snapshot-v1";
  var MANIFEST_KEY = "/__lr-tv/manifest.json";
  var REMOTE = [
    { origin: "https://uuuaylqjllxqjjmvdybm.supabase.co", prefix: "/storage/v1/object/public/tv-videos/" },
    { origin: "https://d2ol7oe51mr4n9.cloudfront.net", prefix: "/user_3J2SlCJJLnfr1N2QBaW2NNwSJSQ/" }
  ];
  var SAME_ORIGIN_PREFIX = "/__l5e/assets-v1/656fe082-70c0-4e39-9ba3-b99f4a1fb7c4/";

  function mediaKey(raw, appOrigin) {
    if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) return null;
    var text = raw.trim();
    if (/[\\\s\u0000-\u001f]/.test(text) || /%(2e|2f|5c|00)/i.test(text) || text.indexOf("..") !== -1) return null;
    if (/^(blob|data|javascript):/i.test(text)) return null;
    var url;
    try { url = new URL(text, appOrigin); } catch (e) { return null; }
    if (url.username || url.password || url.port) return null;
    if (url.pathname.indexOf("//") !== -1 || !/\.mp4$/i.test(url.pathname)) return null;
    var remote = null;
    for (var i = 0; i < REMOTE.length; i++) if (REMOTE[i].origin === url.origin) remote = REMOTE[i];
    if (remote) {
      if (url.protocol !== "https:" || url.pathname.indexOf(remote.prefix) !== 0 || url.pathname.length <= remote.prefix.length) return null;
    } else if (url.origin !== appOrigin || url.pathname.indexOf(SAME_ORIGIN_PREFIX) !== 0) return null;
    return url.origin + url.pathname + url.search;
  }

  /** One byte range only. Returns {full}, {range,start,end} or {unsatisfiable}. */
  function parseRange(header, size) {
    if (header == null) return { kind: "full" };
    var match = /^bytes=(\d*)-(\d*)$/.exec(String(header).trim());
    if (!match || (match[1] === "" && match[2] === "")) return { kind: "full" }; // malformed/multiple: ignore
    if (match[1] === "") {
      var suffix = Number(match[2]);
      if (!Number.isSafeInteger(suffix) || suffix === 0 || size === 0) return { kind: "unsatisfiable" };
      return { kind: "range", start: Math.max(0, size - suffix), end: size - 1 };
    }
    var start = Number(match[1]);
    var end = match[2] === "" ? size - 1 : Number(match[2]);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) return { kind: "full" };
    if (start >= size || end < start) return { kind: "unsatisfiable" };
    return { kind: "range", start: start, end: Math.min(end, size - 1) };
  }

  /** Build the reply from a cached full object. Synthesised 206s are never cached. */
  function buildResponse(blob, request) {
    var size = blob.size;
    var base = { "Content-Type": "video/mp4", "Accept-Ranges": "bytes" };
    var rangeHeader = request.headers.get("range");
    // No stored validator: any If-Range is unverifiable, so serve the full representation.
    if (request.headers.has("if-range")) rangeHeader = null;
    var range = parseRange(rangeHeader, size);
    if (range.kind === "unsatisfiable") {
      return new Response(null, { status: 416, headers: Object.assign({}, base, { "Content-Range": "bytes */" + size }) });
    }
    if (range.kind === "range") {
      return new Response(blob.slice(range.start, range.end + 1, "video/mp4"), { status: 206, headers: Object.assign({}, base, {
        "Content-Range": "bytes " + range.start + "-" + range.end + "/" + size,
        "Content-Length": String(range.end - range.start + 1)
      }) });
    }
    return new Response(blob, { status: 200, headers: Object.assign({}, base, { "Content-Length": String(size) }) });
  }

  async function readManifest(storage) {
    try {
      var cache = await storage.open(SNAPSHOT_CACHE);
      var hit = await cache.match(MANIFEST_KEY);
      if (!hit) return null;
      var manifest = await hit.json();
      return manifest && manifest.schema === 1 && Array.isArray(manifest.eligible) && manifest.ready ? manifest : null;
    } catch (e) { return null; }
  }

  /** Cached reply for an eligible ready file, or null to let the network handle it. */
  async function cachedResponse(request, storage, appOrigin) {
    if (request.method !== "GET") return null;
    var key = mediaKey(request.url, appOrigin);
    if (!key) return null;
    var manifest = await readManifest(storage);
    if (!manifest || !manifest.ready[key] || manifest.eligible.indexOf(key) === -1) return null;
    try {
      var media = await storage.open(MEDIA_CACHE);
      var hit = await media.match(key, { ignoreVary: true });
      if (!hit || hit.status !== 200) return null;
      var blob = await hit.blob(); // storage-backed; slicing does not copy the body into JS memory
      if (blob.size !== manifest.ready[key].bytes) return null;
      return buildResponse(blob, request);
    } catch (e) { return null; }
  }

  scope.LRTVOffline = {
    MEDIA_CACHE: MEDIA_CACHE, SNAPSHOT_CACHE: SNAPSHOT_CACHE,
    mediaKey: mediaKey, parseRange: parseRange, buildResponse: buildResponse, cachedResponse: cachedResponse,
    isOwnedCache: function (name) { return name === MEDIA_CACHE || name === SNAPSHOT_CACHE; }
  };
})(self);
