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
    pub.onLocalStream(stream => makeDisplay(displayName).update(stream))
    const subs = {}
    room.onPublisherAdded(publishers => publishers.forEach(subscribe))
    room.onPublisherRemoved(unsubscribe)
    return {room, publisher: pub, subscribers: subs}


    async function subscribe(publisher) {
        subs[publisher.id] = await room.subscribe([{feed: publisher.id}])
        subs[publisher.id].onRemoteStream(stream => {
            if (!subs[publisher.id].display) subs[publisher.id].display = makeDisplay(publisher.display)
            subs[publisher.id].display.update(stream)
        })
    }
    async function unsubscribe(publisherId) {
        await subs[publisherId].unsubscribe()
        if (subs[publisherId].display) subs[publisherId].display.remove()
    }
}


function makeDisplay(displayName) {
    const $display = $("<div class='display'><div class='name'></div><video autoplay></video></div>").appendTo("#displays")
    $display.find(".name").text(displayName)
    return {
        update: stream => Janus.attachMediaStream($display.find("video").get(0), stream),
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
