# janus-videoroom-js
A Javascript client library for working with the Janus VideoRoom plugin (built on top of janus.js)

## Usage
```javascript
async function joinRoom(server, roomId, displayName) {
    const client = await createVideoRoomClient()
    const session = await client.getSession(server)
    const room = await session.joinRoom(roomId)

    const pub = await room.publish({display: displayName})
    pub.onLocalStream(stream => showVideo(stream))

    const subs = {}
    room.onPublisherAdded(publishers => publishers.forEach(subscribe))
    room.onPublisherRemoved(unsubscribe)


    async function subscribe(publisher) {
        subs[publisher.id] = await room.subscribe([{feed: publisher.id}])
        subs[publisher.id].onRemoteStream(stream => subs[publisher.id].video = showVideo(stream))
    }
    async function unsubscribe(publisherId) {
        await subs[publisherId].unsubscribe()
        subs[publisherId].video.remove()
    }
}
```

## Example
Check out the [example](https://ken107.github.io/janus-videoroom-js/example.html).

## API

### VideoRoomClient
| Property | Description |
| -------- | ----------- |
| getSession(_server_) | Retrieve an existing session or create a new one |

### VideoRoomSession
| Property | Description |
| -------- | ----------- |
| joinRoom(_roomId_) | Joins a room, returns a VideoRoom object |

### VideoRoom
| Property | Description |
| -------- | ----------- |
| pluginHandle | The JanusPluginHandleEx object associated with this room |
| onPublisherAdded(_callback_) | Register a callback for when a publisher publishes media to the room |
| onPublisherRemoved(_callback_) | Register a callback for when a publisher unpublishes |
| publish(_options_) | Publish my webcam and return a VideoRoomPublisher object |
| subscribe(_streams_) | Subscribe to the specified streams and return a VideoRoomSubscriber object |
| leave() | Leave the room |

### VideoRoomPublisher
| Property | Description |
| -------- | ----------- |
| onLocalStream(_callback_) | Register a callback for when the local stream is available to display |
| unpublish() | Stop publishing |

### VideoRoomSubscriber
| Property | Description |
| -------- | ----------- |
| onRemoteStream(_callback_) | Register a callback for when the remote stream is available to display |
| addStreams(_streams_) | Add additional streams to this (multi-stream) subscriber |
| removeStreams(_streams_) | Remove streams from this subscriber |
| pause() | Pause media delivery for this subscriber |
| resume() | Resume media delivery |
| unsubscribe() | Stop subscribing |

### JanusPluginHandleEx
This object is the Janus plugin handle, but augmented with these convenient methods:

| Property | Description |
| -------- | ----------- |
| eventTarget | Used to listen for events on the handle (e.g. consentDialog, webrtcState, slowLink, etc.) |
| sendRequest(_message_) | Send a synchronous request to the plugin |
| sendAsyncRequest(_message_, _jsep_?, _expectResponse_) | Send an asynchronous request to the plugin (_expectResponse_ is a function that will be passed a response and must return a boolean indicating whether it matches the request, e.g. a `{"request":"start"}` will expect a response like `{"videoroom":"event","started":"ok"}`) |
