importScripts("https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js");

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);
} else {
  console.log(`Boo! Workbox didn't load 😬`);
}

workbox.setConfig({
  debug: false,
});

// workbox.routing.registerRoute(({ url }) => {
//   console.log(url);
//   return false;
// }, new workbox.strategies.CacheFirst());

const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin("pollUpdateQueue", {
  maxRetentionTime: 24 * 60, // Retry for max of 24 Hours (specified in minutes),
  onSync: (ev) => {
    ev.queue.replayRequests().then(() => {
      showNotification();
    });
  },
});

workbox.routing.registerRoute(
  /\/api\//,
  new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  "POST"
);

workbox.routing.registerRoute(/\/api\//, new workbox.strategies.NetworkFirst(), "GET");

workbox.routing.registerRoute("/", new workbox.strategies.CacheFirst());

workbox.routing.registerRoute(/\/createPoll\//, new workbox.strategies.CacheFirst());
workbox.routing.registerRoute(/\/poll\//, new workbox.strategies.CacheFirst());

workbox.routing.registerRoute(/\.(?:js|html)$/, new workbox.strategies.CacheFirst());

workbox.routing.registerRoute(
  "https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css",
  new workbox.strategies.CacheFirst()
);

workbox.routing.registerRoute(
  // Cache CSS files.
  /\.css$/,
  // Use cache but update in the background.
  new workbox.strategies.StaleWhileRevalidate({
    // Use a custom cache name.
    cacheName: "css-cache",
  })
);

workbox.routing.registerRoute(
  // Cache image files.
  /\.(?:png|jpg|jpeg|svg|gif)$/,
  // Use the cache if it's available.
  new workbox.strategies.CacheFirst({
    // Use a custom cache name.
    cacheName: "image-cache",
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        // Cache only 20 images.
        maxEntries: 20,
        // Cache for a maximum of a week.
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

function showNotification() {
  sendToClients("Wieder online. Umfrage wird an Server gesendet.");
}

function sendToClients(msg) {
  clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(msg);
    });
  });
}
