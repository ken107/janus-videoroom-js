/**
 * @typedef {import("./videoroom").VideoRoomClient} VideoRoomClient
 */

/** @type {Promise<VideoRoomClient>} */
const clientReady = createVideoRoomClient()


async function connect(server, roomId, displayName) {
    const client = await clientReady
    const session = await client.getSession(server)
    const room = await session.joinRoom(roomId)

    const pub = await room.publish({display: displayName})
    const myVideo = makeDisplay(displayName)
    pub.onTrackAdded(track => myVideo.stream.addTrack(track))
    pub.onTrackRemoved(track => myVideo.stream.removeTrack(track))

    const subs = {}
    room.onPublisherAdded(publishers => publishers.forEach(subscribe))
    room.onPublisherRemoved(unsubscribe)

    return {room, publisher: pub, subscribers: subs}


    async function subscribe(publisher) {
        const sub = subs[publisher.id] = await room.subscribe([{feed: publisher.id}])
        sub.video = makeDisplay(publisher.display)
        sub.onTrackAdded(track => sub.video.stream.addTrack(track))
        sub.onTrackRemoved(track => sub.video.stream.removeTrack(track))
    }
    async function unsubscribe(publisherId) {
        await subs[publisherId].unsubscribe()
        subs[publisherId].video.remove()
    }
}


function makeDisplay(displayName) {
    const stream = new MediaStream()
    const $display = $("<div class='display'><div class='name'></div><video autoplay></video></div>").appendTo("#displays")
    $display.find(".name").text(displayName)
    Janus.attachMediaStream($display.find("video").get(0), stream)
    return {
        stream: stream,
        remove: () => $display.remove()
    }
}

$(function() {
    $("#main-form").submit(function() {
        connect(this.server.value, Number(this.roomId.value), this.displayName.value)
            .then(() => $(this).hide())
            .catch(console.error)
        return false
    })
})
