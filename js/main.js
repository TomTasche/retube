var initialized = false;

function authenticate() {
    var promise = new Promise((resolve, reject) => {
        var authInstance = gapi.auth2.getAuthInstance();
        authInstance.then(function () {
            if (authInstance.isSignedIn.get()) {
                resolve();
            } else {
                gapi.auth2.getAuthInstance().signIn({ scope: "https://www.googleapis.com/auth/youtube.readonly" }).then(resolve);
            }
        }, function (err) {
            gapi.auth2.getAuthInstance().signIn({ scope: "https://www.googleapis.com/auth/youtube.readonly" }).then(resolve);
        });
    });

    return promise;
}
function loadClient() {
    gapi.client.setApiKey("AIzaSyB-SZHmJ9eM9C5zF796D0sC9LJINBMgnHE");
    return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest")
        .then(function () {
            console.log("GAPI client loaded for API");
        }, function (err) {
            console.error("Error loading GAPI client for API", err);
        });
}
function execute() {
    return gapi.client.youtube.subscriptions.list({
        "part": [
            "snippet"
        ],
        "maxResults": 100,
        "mine": true
    }).then(function (response) {
        var channels = response.result.items;
        // skip first (user's own channel)
        var randomChannel = channels[Math.floor(Math.random() * (channels.length - 1)) + 1];

        return gapi.client.youtube.channels.list({
            "part": [
                "contentDetails"
            ],
            "id": [
                randomChannel.snippet.resourceId.channelId
            ],
            "maxResults": 50
        }).then(function (response) {
            loadAllVideos(response.result.items[0].contentDetails.relatedPlaylists.uploads);
        }, function (err) { console.error("Execute error", err); });
    }, function (err) { console.error("Execute error", err); });
}

function loadAllVideos(playlistId, pageToken, allVideos) {
    if (!allVideos) {
        allVideos = [];
    }

    return gapi.client.youtube.playlistItems.list({
        "part": [
            "snippet"
        ],
        "playlistId": playlistId,
        "maxResults": 50,
        "pageToken": pageToken
    }).then(function (response) {
        allVideos = allVideos.concat(response.result.items);

        var nextPageToken = response.result.nextPageToken;
        if (nextPageToken) {
            return loadAllVideos(playlistId, nextPageToken, allVideos);
        } else {
            var randomVideo = allVideos[Math.floor(Math.random() * (allVideos.length))];

            player.cueVideoById(randomVideo.snippet.resourceId.videoId, 0);
        }
    }, function (err) { console.error("Execute error", err); });
}

gapi.load("client:auth2", function () {
    gapi.auth2.init({ client_id: "349450720184-4f5jbjh4m1seootc5g5l8d24ns81rlb8.apps.googleusercontent.com" });
});

var overlay = new PlainOverlay({ face: document.getElementById("message"), style: { cursor: "pointer" } });
overlay.show();

document.addEventListener('click', function (event) {
    if (!initialized) {
        initialized = true;
        overlay.hide();

        overlay = new PlainOverlay();
        overlay.show();

        authenticate().then(loadClient).then(execute).then(function () {
            overlay.hide();
        });
    }
});