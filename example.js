/**
 * @typedef {import("./videoroom").VideoRoomClient} VideoRoomClient
 */

/** @type {Promise<VideoRoomClient>} */
const clientReady = createVideoRoomClient()

/* Use a single (multi-stream) subscriber for all subscriptions */
/** @type {Promise<VideoRoomSubscriber} */
let subscriberPromise


async function connect(server, displayName) {
    const client = await clientReady
    const session = await client.getSession(server)
    
    const room = await session.joinRoom("room-1234")
    room.onPublisherAdded(subscribeToPublisher)
    room.onPublisherRemoved(unsubscribeFromPublisher)
    
    const publisher = await room.publish({display: displayName})
    publisher.onTrackAdded(showLocalTrack)
    publisher.onTrackRemoved(hideLocalTrack)

    return {room, publisher}
}


async function subscribeToPublisher(publishers) {
    if (subscriberPromise) {
        const subscriber = await subscriberPromise
        await subscriber.addStreams(publishers.map(p => ({feed: p.id})))
    }
    else {
        subscriberPromise = room.subscribe(publishers.map(p => ({feed: p.id})))
        const subscriber = await subscriberPromise
        subscriber.onTrackAdded(showRemoteTrack)
        subscriber.onTrackRemoved(hideRemoteTrack)
    }
}

function unsubscribeFromPublisher(publisherId) {
    const subscriber = await subscriberPromise
    await subscriber.removeStreams([{feed: publisherId}])
}


function showLocalTrack(track) {
}

function hideLocalTrack(track) {
}

function showRemoteTrack(track, mid) {
}

function hideRemoteTrack(track, mid) {
}
