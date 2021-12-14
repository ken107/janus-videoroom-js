# janus-videoroom-js
A promise-based, type-annotated Javascript library for working with the Janus VideoRoom plugin (built on top of janus.js)

### API
```javascript
async function joinRoom(server, roomId) {
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
        subs[publisherId].unsubscribe()
        subs[publisherId].video.remove()
    }
}
```

### Example
Check out the [example](https://ken107.github.io/janus-videoroom-js/example.html).
