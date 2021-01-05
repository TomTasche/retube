var initialized = false;
var player;
var overlay;

function authenticate() {
    return gapi.auth2.getAuthInstance().signIn({ scope: "https://www.googleapis.com/auth/youtube.readonly" });
}
function loadClient() {
    gapi.client.setApiKey("AIzaSyB-SZHmJ9eM9C5zF796D0sC9LJINBMgnHE");
    return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest")
        .then(function () {
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
        console.log(response);

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

    // TODO: exclude rated videos - https://developers.google.com/youtube/v3/docs/videos/list?authuser=0

    return gapi.client.youtube.playlistItems.list({
        "part": [
            "snippet"
        ],
        "playlistId": playlistId,
        "maxResults": 50,
        "pageToken": pageToken
    }).then(function (response) {
        console.log(response);

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

function startLoading() {
    overlay.hide();

    overlay = new PlainOverlay();
    overlay.show();

    loadClient().then(execute);
}

document.addEventListener('click', function (event) {
    if (!initialized) {
        initialized = true;
        
        startLoading();
    }
});

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.CUED) {
        overlay.hide();
    }

    // TODO: ask to rate at the end of a video
}

window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('player', {
        events: {
            'onStateChange': onPlayerStateChange
        }
    });

    overlay = new PlainOverlay();
    overlay.show();

    gapi.load("client:auth2", function () {
        gapi.auth2.init({ client_id: "349450720184-4f5jbjh4m1seootc5g5l8d24ns81rlb8.apps.googleusercontent.com" });

        var authInstance = gapi.auth2.getAuthInstance();
        authInstance.then(function () {
            if (authInstance.isSignedIn.get()) {
                overlay.hide();
                
                startLoading();
            }
        }, function (err) {
            overlay.hide();

            // TODO: improve guidance, explain what this app does
            overlay = new PlainOverlay({ face: document.getElementById("message"), style: { cursor: "pointer" } });
            overlay.show();    
        });
    });
}