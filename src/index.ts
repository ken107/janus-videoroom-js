import { JanusMediaOptions, JanusMessage, JanusMid, JanusPluginHandle, JanusPublishOptions, JanusSession, JanusSessionOptions, JanusStreamSpec, JanusSubscriberConfigureOptions, JanusWatchOptions, Jsep } from "./janus"

interface VideoRoomClient {
    createSession(server: string|string[], options?: JanusSessionOptions): Promise<VideoRoomSession>
}

interface VideoRoomSession {
    eventTarget: ReturnType<typeof makeEventTarget>
    isValid(): boolean
    joinRoom(roomId: string|number): Promise<VideoRoom>
    subscribe(roomId: string|number, streams: JanusStreamSpec[], options?: {mediaOptions?: JanusMediaOptions}): Promise<VideoRoomSubscriber>
    watch(mountPointId: number, options?: {watchOptions?: JanusWatchOptions, mediaOptions?: JanusMediaOptions}): Promise<StreamingSubscriber>
    attachToPlugin(plugin: string): Promise<JanusPluginHandleEx>
    destroy(): Promise<void>
}

interface VideoRoom {
    roomId: string|number
    pluginHandle: JanusPluginHandleEx
    onPublisherAdded(callback: (publishers: unknown[]) => void): void
    onPublisherRemoved(callback: (publisherId: unknown) => void): void
    publish(options?: {publishOptions?: JanusPublishOptions, mediaOptions?: JanusMediaOptions}): Promise<VideoRoomPublisher>
    subscribe(streams: JanusStreamSpec[], options?: {mediaOptions?: JanusMediaOptions}): Promise<VideoRoomSubscriber>
    leave(): Promise<void>
}

interface VideoRoomPublisher {
    publisherId: string|number
    onTrackAdded(callback: (track: MediaStreamTrack) => void): void
    onTrackRemoved(callback: (track: MediaStreamTrack) => void): void
    configure(configureOptions: JanusPublishOptions): Promise<void>
    restart(mediaOptions: JanusMediaOptions): Promise<void>
    unpublish(): Promise<void>
}

interface VideoRoomSubscriber {
    onTrackAdded(callback: (track: MediaStreamTrack, mid: JanusMid) => void): void
    onTrackRemoved(callback: (track: MediaStreamTrack, mid: JanusMid) => void): void
    addStreams(streams: JanusStreamSpec[]): Promise<void>
    removeStreams(streams: JanusStreamSpec[]): Promise<void>
    pause(): Promise<void>
    resume(): Promise<void>
    configure(configureOptions: JanusSubscriberConfigureOptions): Promise<void>
    restart(mediaOptions: JanusMediaOptions): Promise<void>
    unsubscribe(): Promise<void>
}

interface StreamingSubscriber {
    onTrackAdded(callback: (track: MediaStreamTrack, mid: JanusMid) => void): void
    onTrackRemoved(callback: (track: MediaStreamTrack, mid: JanusMid) => void): void
    pause(): Promise<void>
    resume(): Promise<void>
    configure(configureOptions: JanusSubscriberConfigureOptions): Promise<void>
    switch(mountPointId: number): Promise<void>
    restart(options?: {watchOptions?: JanusWatchOptions, mediaOptions?: JanusMediaOptions}): Promise<void>
    unsubscribe(): Promise<void>
}

interface JanusPluginHandleEx extends JanusPluginHandle {
    eventTarget: ReturnType<typeof makeEventTarget>
    sendRequest(message: JanusMessage): Promise<JanusMessage>
    sendAsyncRequest(options: {message: JanusMessage, jsep?: Jsep, expectResponse: (response: AsyncResponse) => boolean}): Promise<AsyncResponse>
}

interface AsyncResponse {
    message: JanusMessage
    jsep?: Jsep
}



export async function createVideoRoomClient(
    options?: {
        debug?: boolean|string[],
        dependencies?: unknown
    }
): Promise<VideoRoomClient> {
    await new Promise(f => Janus.init({...options, callback: f}))

    return {
        createSession: createVideoRoomSession
    }
}



async function createVideoRoomSession(server: string|string[], options?: JanusSessionOptions): Promise<VideoRoomSession> {
    const eventTarget = makeEventTarget()
    let session: JanusSession

    await new Promise<void>(function(fulfill, reject) {
        let resolved = false
        session = new Janus({
            ...options,
            server,
            success() {
                if (!resolved) {
                    fulfill()
                    resolved = true
                }
                else {
                    //reconnected
                }
            },
            error(err: unknown) {
                if (!resolved) {
                    reject(err)
                    resolved = true
                }
                else if (typeof err == "string" && err.startsWith("Lost connection")) {
                    eventTarget.dispatchEvent(new CustomEvent("connectionLost"))
                }
                else {
                    console.error(err)
                }
            },
        })
    })

    return {
        eventTarget,
        isValid() {
            return session.isConnected()
        },
        joinRoom(roomId) {
            return joinVideoRoom(session, roomId)
        },
        subscribe(roomId, streams, options) {
            return createVideoRoomSubscriber(session, roomId, streams, options)
        },
        watch(mountPointId, options) {
            return createStreamingSubscriber(session, mountPointId, options)
        },
        attachToPlugin(plugin) {
            return attachToPlugin(session, plugin)
        },
        async destroy() {
            await new Promise(function(fulfill, reject) {
                session.destroy({
                    success: fulfill,
                    error: reject
                })
            })
        }
    }
}



async function attachToPlugin(session: JanusSession, plugin: string): Promise<JanusPluginHandleEx> {
    const pendingRequests: {acceptResponse(response: AsyncResponse): boolean}[] = []
    const eventTarget = makeEventTarget()

    const handle: JanusPluginHandleEx = await new Promise(function(fulfill, reject) {
        session.attach({
            plugin: plugin,
            success: fulfill,
            error: reject,
            consentDialog(state: unknown) {
                eventTarget.dispatchEvent(new CustomEvent("consentDialog", {detail: {state: state}}))
            },
            webrtcState(state: unknown, reason: unknown) {
                eventTarget.dispatchEvent(new CustomEvent("webrtcState", {detail: {state: state, reason: reason}}))
            },
            iceState(state: unknown) {
                eventTarget.dispatchEvent(new CustomEvent("iceState", {detail: {state: state}}))
            },
            mediaState(state: unknown) {
                eventTarget.dispatchEvent(new CustomEvent("mediaState", {detail: {state: state}}))
            },
            slowLink(state: unknown) {
                eventTarget.dispatchEvent(new CustomEvent("slowLink", {detail: {state: state}}))
            },
            onmessage(message: JanusMessage, jsep: Jsep) {
                const response = {message: message, jsep: jsep}
                const index = pendingRequests.findIndex(x => x.acceptResponse(response))
                if (index != -1) pendingRequests.splice(index, 1)
                else eventTarget.dispatchEvent(new CustomEvent("message", {detail: {message: message, jsep: jsep}}))
            },
            onlocaltrack(track: MediaStreamTrack, added: boolean) {
                eventTarget.dispatchEvent(new CustomEvent("localtrack", {detail: {track: track, added: added}}))
            },
            onremotetrack(track: MediaStreamTrack, mid: JanusMid, added: boolean) {
                eventTarget.dispatchEvent(new CustomEvent("remotetrack", {detail: {track: track, mid: mid, added: added}}))
            },
            ondataopen(label: unknown, protocol: unknown) {
                eventTarget.dispatchEvent(new CustomEvent("dataopen", {detail: {label: label, protocol: protocol}}))
            },
            ondata(data: unknown, label: unknown) {
                eventTarget.dispatchEvent(new CustomEvent("data", {detail: {data: data, label: label}}))
            },
            oncleanup() {
                eventTarget.dispatchEvent(new CustomEvent("cleanup"))
            },
            ondetached() {
                eventTarget.dispatchEvent(new CustomEvent("detached"))
            }
        })
    })

    // extend the handle to add convenience methods
    handle.eventTarget = eventTarget

    // method to send a synchrnous request to the plugin
    handle.sendRequest = function(message) {
        return new Promise(function(fulfill, reject) {
            handle.send({
                message: message,
                success: fulfill,
                error: reject
            })
        })
    }

    // method to send an asynchronous request to the plugin
    let pending: Promise<unknown> = Promise.resolve()
    handle.sendAsyncRequest = function(request) {
        const promise = pending.catch(function() {})
            .then(async function() {
                await new Promise(function(fulfill, reject) {
                    handle.send({
                        message: request.message,
                        jsep: request.jsep,
                        success: fulfill,
                        error: reject
                    })
                })
                return new Promise<AsyncResponse>(function(fulfill, reject) {
                    pendingRequests.push({
                        acceptResponse(response) {
                            if ((response.message.videoroom == "event" || response.message.streaming == "event") && response.message.error_code) {
                                const err: Error & {code?: unknown} = new Error(response.message.error || response.message.error_code)
                                err.code = response.message.error_code
                                reject(err)
                                return true
                            }
                            else if (request.expectResponse(response)) {
                                fulfill(response)
                                return true
                            }
                            else {
                                return false
                            }
                        }
                    })
                })
            })
        pending = promise
        return promise
    }

    return handle
}



async function joinVideoRoom(session: JanusSession, roomId: string|number): Promise<VideoRoom> {
    const cleanup = makeCleanup()
    const callbacks = makeCallbacks()

    try {
        // attach to plugin and get a new handle for this room
        const handle = await attachToPlugin(session, "janus.plugin.videoroom")

        // remember to detach
        cleanup.add(async function() {
            await new Promise(function(fulfill, reject) {
                handle.detach({
                    success: fulfill,
                    error: reject
                })
            })
        })

        // listen to events and invoke callbacks
        handle.eventTarget.addEventListener("message", function(event) {
            const message = event.detail.message
            if (message.videoroom == "event" && message.room == roomId) {
                if (message.publishers) {
                    callbacks.get("onPublisherAdded")
                        .then(callback => callback(message.publishers))
                        .catch(console.error)
                }
                if (message.unpublished) {
                    callbacks.get("onPublisherRemoved")
                        .then(callback => callback(message.unpublished))
                        .catch(console.error)
                }
            }
        })

        // send the join request
        const response = await handle.sendAsyncRequest({
            message: {
                request: "join",
                ptype: "publisher",
                room: roomId,
            },
            expectResponse: r => r.message.videoroom == "joined" && r.message.room == roomId
        })

        // invoke callback with the initial list of publishers
        if (response.message.publishers.length) {
            callbacks.get("onPublisherAdded")
                .then(callback => callback(response.message.publishers))
                .catch(console.error)
        }

        // construct and return the VideoRoom object
        return {
            roomId: roomId,
            pluginHandle: handle,
            onPublisherAdded(callback) {
                callbacks.set("onPublisherAdded", callback)
            },
            onPublisherRemoved(callback) {
                callbacks.set("onPublisherRemoved", callback)
            },
            publish(options) {
                return createVideoRoomPublisher(handle, response.message.id, options)
            },
            subscribe(streams, options) {
                return createVideoRoomSubscriber(session, roomId, streams, options)
            },
            async leave() {
                await cleanup.run()
            }
        }
    }
    catch (err) {
        await cleanup.run().catch(console.error)
        throw err
    }
}



async function createVideoRoomPublisher(
    handle: JanusPluginHandleEx,
    publisherId: string|number,
    opts?: {
        publishOptions?: JanusPublishOptions,
        mediaOptions?: JanusMediaOptions
    }
): Promise<VideoRoomPublisher> {

    const options = {...opts}
    const cleanup = makeCleanup()
    const callbacks = makeCallbacks()

    // listen to events and invoke callbacks
    const onLocalTrack = function(event: CustomEvent) {
        if (event.detail.added) {
            callbacks.get("onTrackAdded")
                .then(callback => callback(event.detail.track))
                .catch(console.error)
        }
        else {
            callbacks.get("onTrackRemoved")
                .then(callback => callback(event.detail.track))
                .catch(console.error)
        }
    }
    handle.eventTarget.addEventListener("localtrack", onLocalTrack)

    // remember to remove the event listener
    cleanup.add(function() {
        handle.eventTarget.removeEventListener("localtrack", onLocalTrack)
    })

    try {
        // send the publish request
        const offerJsep = await new Promise<Jsep>(function(fulfill, reject) {
            // the offer (local) sdp can be customized via mediaOptions.customizeSdp
            handle.createOffer({
                ...options.mediaOptions,
                success: fulfill,
                error: reject
            })
        })

        const response = await handle.sendAsyncRequest({
            message: {
                ...options.publishOptions,
                request: "publish"
            },
            jsep: offerJsep,
            expectResponse: r => r.message.videoroom == "event" && r.message.configured == "ok"
        })

        // remember to unpublish
        cleanup.add(async function() {
            await handle.sendAsyncRequest({
                message: {request: "unpublish"},
                expectResponse: r => r.message.videoroom == "event" && r.message.unpublished == "ok"
            })
        })

        // handle the answer JSEP
        await new Promise(function(fulfill, reject) {
            handle.handleRemoteJsep({
                jsep: response.jsep,
                success: fulfill,
                error: reject,
                customizeSdp: options.mediaOptions && options.mediaOptions.customizeRemoteSdp
            })
        })

        // construct and return the VideoRoomPublisher object
        return {
            publisherId: publisherId,
            onTrackAdded(callback) {
                callbacks.set("onTrackAdded", callback)
            },
            onTrackRemoved(callback) {
                callbacks.set("onTrackRemoved", callback)
            },
            async configure(configureOptions) {
                await handle.sendAsyncRequest({
                    message: {
                        ...configureOptions,
                        request: "configure"
                    },
                    expectResponse: r => r.message.videoroom == "event" && r.message.configured == "ok"
                })
            },
            async restart(mediaOptions) {
                const offerJsep = await new Promise<Jsep>(function(fulfill, reject) {
                    handle.createOffer({
                        ...mediaOptions,
                        success: fulfill,
                        error: reject
                    })
                })
                const response = await handle.sendAsyncRequest({
                    message: {
                        request: "configure",
                    },
                    jsep: offerJsep,
                    expectResponse: r => r.message.videoroom == "event" && r.message.configured == "ok"
                })
                await new Promise(function(fulfill, reject) {
                    handle.handleRemoteJsep({
                        jsep: response.jsep,
                        success: fulfill,
                        error: reject
                    })
                })
                options.mediaOptions = mediaOptions
            },
            async unpublish() {
                await cleanup.run()
            }
        }
    }
    catch (err) {
        await cleanup.run().catch(console.error)
        throw err
    }
}



async function createVideoRoomSubscriber(
    session: JanusSession,
    roomId: string|number,
    streams: JanusStreamSpec[],
    opts?: {
        mediaOptions?: JanusMediaOptions
    }
): Promise<VideoRoomSubscriber> {

    const options = {...opts}
    const cleanup = makeCleanup()
    const callbacks = makeCallbacks()

    try {
        // attach to plugin and get a separate handle for this subscriber
        const handle = await attachToPlugin(session, "janus.plugin.videoroom")

        // remember to detach
        cleanup.add(async function() {
            await new Promise(function(fulfill, reject) {
                handle.detach({
                    success: fulfill,
                    error: reject
                })
            })
        })

        // listen to events and invoke callbacks
        handle.eventTarget.addEventListener("remotetrack", function(event) {
            if (event.detail.added) {
                callbacks.get("onTrackAdded")
                    .then(callback => callback(event.detail.track, event.detail.mid))
                    .catch(console.error)
            }
            else {
                callbacks.get("onTrackRemoved")
                    .then(callback => callback(event.detail.track, event.detail.mid))
                    .catch(console.error)
            }
        })

        // join the room as a subscriber
        const response = await handle.sendAsyncRequest({
            message: {
                request: "join",
                ptype: "subscriber",
                room: roomId,
                streams: streams
            },
            expectResponse: r => r.message.videoroom == "attached" && r.message.room == roomId
        })

        if (!response.jsep) throw new Error("Missing offer Jsep")
        await handleOffer(handle, response.jsep, options.mediaOptions)

        // construct and return the VideoRoomSubscriber object
        return {
            onTrackAdded(callback) {
                callbacks.set("onTrackAdded", callback)
            },
            onTrackRemoved(callback) {
                callbacks.set("onTrackRemoved", callback)
            },
            async addStreams(streams) {
                const response = await handle.sendAsyncRequest({
                    message: {request: "subscribe", streams: streams},
                    expectResponse: r => r.message.videoroom == "updated" && r.message.room == roomId
                })
                if (response.jsep) await handleOffer(handle, response.jsep, options.mediaOptions)
            },
            async removeStreams(streams) {
                const response = await handle.sendAsyncRequest({
                    message: {request: "unsubscribe", streams: streams},
                    expectResponse: r => r.message.videoroom == "updated" && r.message.room == roomId
                })
                if (response.jsep) await handleOffer(handle, response.jsep, options.mediaOptions)
            },
            async pause() {
                await handle.sendAsyncRequest({
                    message: {request: "pause"},
                    expectResponse: r => r.message.videoroom == "event" && r.message.paused == "ok"
                })
            },
            async resume() {
                await handle.sendAsyncRequest({
                    message: {request: "start"},
                    expectResponse: r => r.message.videoroom == "event" && r.message.started == "ok"
                })
            },
            async configure(configureOptions) {
                await handle.sendAsyncRequest({
                    message: {
                        ...configureOptions,
                        request: "configure",
                        restart: false
                    },
                    expectResponse: r => r.message.videoroom == "event" && r.message.configured == "ok"
                })
            },
            async restart(mediaOptions) {
                const response = await handle.sendAsyncRequest({
                    message: {
                        request: "configure",
                        restart: true
                    },
                    expectResponse: r => r.message.videoroom == "event" && r.message.configured == "ok"
                })
                if (!response.jsep) throw new Error("Missing offer Jsep")
                await handleOffer(handle, response.jsep, mediaOptions)
                options.mediaOptions = mediaOptions
            },
            async unsubscribe() {
                await cleanup.run()
            }
        }
    }
    catch (err) {
        await cleanup.run().catch(console.error)
        throw err
    }
}



async function createStreamingSubscriber(
    session: JanusSession,
    mountPointId: number,
    opts?: {
        watchOptions?: JanusWatchOptions
        mediaOptions?: JanusMediaOptions
    }
): Promise<StreamingSubscriber> {

    let options = {...opts}
    const cleanup = makeCleanup()
    const callbacks = makeCallbacks()

    try {
        // attach to the streaming plugin
        const handle = await attachToPlugin(session, "janus.plugin.streaming")

        // remember to detach
        cleanup.add(async function() {
            await new Promise(function(fulfill, reject) {
                handle.detach({
                    success: fulfill,
                    error: reject
                })
            })
        })

        // listen to events and invoke callbacks
        handle.eventTarget.addEventListener("remotetrack", function(event) {
            if (event.detail.added) {
                callbacks.get("onTrackAdded")
                    .then(callback => callback(event.detail.track, event.detail.mid))
                    .catch(console.error)
            }
            else {
                callbacks.get("onTrackRemoved")
                    .then(callback => callback(event.detail.track, event.detail.mid))
                    .catch(console.error)
            }
        })

        // send the watch request
        const response = await handle.sendAsyncRequest({
            message: {
                ...options.watchOptions,
                request: "watch",
                id: mountPointId
            },
            expectResponse: r => r.message.streaming == "event" && r.message.result && r.message.result.status == "preparing"
        })

        if (!response.jsep) throw new Error("Missing offer Jsep")
        await handleOffer(handle, response.jsep, options.mediaOptions)

        // construct and return the StreamingSubscriber object
        return {
            onTrackAdded(callback) {
                callbacks.set("onTrackAdded", callback)
            },
            onTrackRemoved(callback) {
                callbacks.set("onTrackRemoved", callback)
            },
            async pause() {
                await handle.sendAsyncRequest({
                    message: {request: "pause"},
                    expectResponse: r => r.message.streaming == "event" && r.message.result && r.message.result.status == "pausing"
                })
            },
            async resume() {
                await handle.sendAsyncRequest({
                    message: {request: "start"},
                    expectResponse: r => r.message.streaming == "event" && r.message.result && r.message.result.status == "starting"
                })
            },
            async configure(configureOptions) {
                await handle.sendAsyncRequest({
                    message: {
                        ...configureOptions,
                        request: "configure"
                    },
                    expectResponse: r => r.message.streaming == "event" && r.message.result && r.message.result.event == "configured"
                })
            },
            async switch(newMountPointId) {
                await handle.sendAsyncRequest({
                    message: {
                        request: "switch",
                        id: newMountPointId
                    },
                    expectResponse: r => r.message.streaming == "event" && r.message.result && r.message.result.switched == "ok"
                })
                mountPointId = newMountPointId
            },
            async restart(newOpts) {
                const newOptions = {...newOpts}
                const response = await handle.sendAsyncRequest({
                    message: {
                        ...newOptions.watchOptions,
                        request: "watch",
                        id: mountPointId
                    },
                    expectResponse: r => r.message.streaming == "event" && r.message.result && r.message.result.status == "preparing"
                })
                if (!response.jsep) throw new Error("Missing offer Jsep")
                await handleOffer(handle, response.jsep, newOptions.mediaOptions)
                options = newOptions
            },
            async unsubscribe() {
                await cleanup.run()
            }
        }
    }
    catch (err) {
        await cleanup.run().catch(console.error)
        throw err
    }
}



async function handleOffer(handle: JanusPluginHandleEx, offerJsep: Jsep, mediaOptions?: JanusMediaOptions): Promise<void> {
    // allow customizing the remote (offer) sdp
    if (mediaOptions && mediaOptions.customizeRemoteSdp) {
        mediaOptions.customizeRemoteSdp(offerJsep)
    }

    // create and send the answer
    const answerJsep = await new Promise<Jsep>(function(fulfill, reject) {
        // the answer (local) sdp can be customized via mediaOptions.customizeSdp
        handle.createAnswer({
            ...mediaOptions,
            jsep: offerJsep,
            success: fulfill,
            error: reject
        })
    })

    await handle.sendAsyncRequest({
        message: {request: "start"},
        jsep: answerJsep,
        expectResponse: r => r.message.videoroom == "event" && r.message.started == "ok" ||
            r.message.streaming == "event" && r.message.result && r.message.result.status == "starting"
    })
}



function makeCleanup() {
    type Task = () => void|Promise<void>
    const tasks: Task[] = []
    return {
        add(task: Task) {
            tasks.push(task)
        },
        run() {
            let promise = Promise.resolve()
            for (let i=tasks.length-1; i>=0; i--) promise = promise.then(tasks[i])
            return promise
        }
    }
}

function makeCallbacks() {
    const pending: {[name: string]: {promise: Promise<Function>, fulfill: (callback: Function) => void}} = {}
    const getPending = (name: string) => {
        if (!pending[name]) {
            let fulfill = function(_: Function) {}
            const promise = new Promise<Function>(f => fulfill = f)
            pending[name] = {promise, fulfill}
        }
        return pending[name]
    }
    return {
        get(name: string) {
            return getPending(name).promise
        },
        set(name: string, value: Function) {
            getPending(name).fulfill(value)
        }
    }
}

function makeEventTarget() {
    const listeners: {[name: string]: Function[]} = {}
    return {
        addEventListener(name: string, callback: (event: CustomEvent) => void) {
            if (!listeners[name]) listeners[name] = []
            listeners[name].push(callback)
        },
        removeEventListener(name: string, callback: (event: CustomEvent) => void) {
            if (!listeners[name]) return
            const index = listeners[name].indexOf(callback)
            if (index >= 0) listeners[name].splice(index, 1)
        },
        dispatchEvent(event: Event) {
            if (!listeners[event.type]) return
            for (let i=0; i<listeners[event.type].length; i++) {
                listeners[event.type][i](event)
            }
        }
    }
}