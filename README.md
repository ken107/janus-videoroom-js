# janus-simple-videoroom-client
Built on top of janus.js, this thin client library provides a simple high-level API that makes it easy to work with the Janus VideoRoom plugin.

## Install
`npm install janus-simple-videoroom-client`

## Usage
```javascript
import { createVideoRoomClient } from "janus-simple-videoroom-client"

async function joinRoom(server, roomId, displayName) {
    const client = await createVideoRoomClient()
    const session = await client.createSession(server)
    const room = await session.joinRoom(roomId)

    const pub = await room.publish({display: displayName})
    pub.onTrackAdded(track => showVideo(track))
    pub.onTrackRemoved(track => hideVideo(track))

    const subs = {}
    room.onPublisherAdded(publishers => publishers.forEach(subscribe))
    room.onPublisherRemoved(unsubscribe)


    async function subscribe(publisher) {
        subs[publisher.id] = await room.subscribe([{feed: publisher.id}])
        subs[publisher.id].onTrackAdded(track => showVideo(track))
        subs[publisher.id].onTrackRemoved(track => hideVideo(track))
    }
    async function unsubscribe(publisherId) {
        await subs[publisherId].unsubscribe()
    }
}
```

## Example
Check out the [example](https://ken107.github.io/janus-videoroom-js/example.html).

## API

### VideoRoomClient

| Property | Description |
| -------- | ----------- |
| createSession(_server_, _options_) | Create a new VideoRoom session |

### VideoRoomSession

| Property | Description |
| -------- | ----------- |
| isValid() | Return whether the session is connected and valid |
| joinRoom(_roomId_) | Joins a room, returns a VideoRoom object |
| watch(_mountpointId_, _options_) | Subscribe to a streaming mountpoint, return a StreamingSubscriber object |
| attachToPlugin() | Attach to the VideoRoom plugin without joining a room, returns a JanusPluginHandleEx object |
| destroy() | Destroy the session |

### VideoRoom

| Property | Description |
| -------- | ----------- |
| pluginHandle | The JanusPluginHandleEx object associated with this room |
| onPublisherAdded(_callback_) | Register a callback for when a publisher publishes media to the room |
| onPublisherRemoved(_callback_) | Register a callback for when a publisher unpublishes |
| publish(_options_) | Publish my webcam and return a VideoRoomPublisher object |
| subscribe(_streams_, _options_) | Subscribe to the specified streams and return a VideoRoomSubscriber object |
| leave() | Leave the room |

### VideoRoomPublisher

| Property | Description |
| -------- | ----------- |
| publisherId | |
| onTrackAdded(_callback_) | Register a callback for when a local MediaStreamTrack is available to display |
| onTrackRemoved(_callback_) | Register a callback for when a local MediaStreamTrack terminates |
| configure(_options_) | Modify publisher properties |
| restart(_options_) | Trigger an ICE restart |
| unpublish() | Stop publishing |

### VideoRoomSubscriber

| Property | Description |
| -------- | ----------- |
| pluginHandle | The JanusPluginHandleEx object associated with this subscriber |
| onTrackAdded(_callback_) | Register a callback for when a remote MediaStreamTrack is available to display |
| onTrackRemoved(_callback_) | Register a callback for when a remote MediaStreamTrack terminates |
| addStreams(_streams_) | Add additional streams to this (multi-stream) subscriber |
| removeStreams(_streams_) | Remove streams from this subscriber |
| pause() | Pause media delivery for this subscriber |
| resume() | Resume media delivery |
| configure(_options_) | Modify subscription properties |
| restart(_options_) | Trigger an ICE restart |
| unsubscribe() | Stop subscribing |

### JanusPluginHandleEx
This object is the Janus plugin handle, but augmented with these convenient methods:

| Property | Description |
| -------- | ----------- |
| eventTarget | Used to listen for events on the handle (e.g. consentDialog, webrtcState, slowLink, etc.) |
| sendRequest(_message_) | Send a synchronous request to the plugin |
| sendAsyncRequest(_message_, _jsep_?, _expectResponse_) | Send an asynchronous request to the plugin (_expectResponse_ is a function that will be passed a response and must return a boolean indicating whether it matches the request, e.g. a `{"request":"start"}` will expect a response like `{"videoroom":"event","started":"ok"}`) |
