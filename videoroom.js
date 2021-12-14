/**
 * @typedef {Object} VideoRoomClient
 * @property {(server: string|string[]) => Promise<VideoRoomSession>} getSession
 */

/**
 * @typedef {Object} VideoRoomSession
 * @property {(roomId: any) => Promise<VideoRoom>} joinRoom
 */

/**
 * @typedef {Object} VideoRoom
 * @property {JanusPluginHandleEx} pluginHandle
 * @property {(callback: (publishers: any[]) => void) => void} onPublisherAdded
 * @property {(callback: (publisherId: any) => void) => void} onPublisherRemoved
 * @property {(options: any) => Promise<VideoRoomPublisher>} publish
 * @property {(streams: any[]) => Promise<VideoRoomSubscriber>} subscribe
 * @property {() => Promise<void>} leave
 */

/**
 * @typedef {Object} VideoRoomPublisher
 * @property {(callback: (track: MediaStreamTrack) => void) => void} onTrackAdded
 * @property {(callback: (track: MediaStreamTrack) => void) => void} onTrackRemoved
 * @property {() => Promise<void>} unpublish
 */

/**
 * @typedef {Object} VideoRoomSubscriber
 * @property {(callback: (track: MediaStreamTrack, mid: any) => void) => void} onTrackAdded
 * @property {(callback: (track: MediaStreamTrack, mid: any) => void) => void} onTrackRemoved
 * @property {(streams: any[]) => Promise<void>} addStreams
 * @property {(streams: any[]) => Promise<void>} removeStreams
 * @property {() => Promise<void>} pause
 * @property {() => Promise<void>} resume
 * @property {() => Promise<void>} unsubscribe
 */

/**
 * @typedef {Object} JanusSession
 * @property {Function} attach
 */

/**
 * @typedef {Object} JanusPluginHandleEx
 * @property {EventTarget} eventTarget
 * @property {(message: any) => Promise<any>} sendRequest
 * @property {SendAsyncRequest} sendAsyncRequest
 */

/**
 * @callback SendAsyncRequest
 * @param {{message: any, jsep?: any, expectResponse: (response: AsyncResponse) => boolean}} options
 * @returns {Promise<AsyncResponse>}
 */

/**
 * @typedef {Object} AsyncResponse
 * @property {any} message
 * @property {any} [jsep]
 */



/**
 * @returns {Promise<VideoRoomClient>}
 */
function createVideoRoomClient() {
    return new Promise(function(fulfill) {
        Janus.init({
            debug: true,
            dependencies: Janus.useDefaultDependencies(),
            callback: fulfill
        })
    })
    .then(function() {
        var sessionPromises = {}
        return {
            getSession: function(server) {
                var key = Array.isArray(server) ? server.join(',') : server
                return Promise.resolve(sessionPromises[key])
                    .then(function(session) {
                        if (session && session.isValid()) return session
                        else return sessionPromises[key] = createVideoRoomSession(server)
                    })
            }
        }
    })
}


/**
 * @param {string|string[]} server
 * @returns {Promise<VideoRoomSession>}
 */
function createVideoRoomSession(server) {
    var isDestroyed = false
    return new Promise(function(fulfill, reject) {
        return new Janus({
            server: server,
            success: fulfill,
            error: reject,
            destroyed: function() {
                isDestroyed = true
            }
        })
    })
    .then(function(session) {
        return {
            isValid: function() {
                return !isDestroyed
            },
            joinRoom: function(roomId) {
                return joinVideoRoom(session, roomId)
            }
        }
    })
}


/**
 * @param {JanusSession} session
 * @returns {Promise<JanusPluginHandleEx>}
 */
function attachToPlugin(session) {
    var pendingRequests = []
    var eventTarget = new EventTarget()
    return new Promise(function(fulfill, reject) {
        session.attach({
            plugin: "janus.plugin.videoroom",
            success: fulfill,
            error: reject,
            consentDialog: function(state) {
                eventTarget.dispatchEvent(new CustomEvent("consentDialog", {detail: {state: state}}))
            },
            webrtcState: function(state, reason) {
                eventTarget.dispatchEvent(new CustomEvent("webrtcState", {detail: {state: state, reason: reason}}))
            },
            iceState: function(state) {
                eventTarget.dispatchEvent(new CustomEvent("iceState", {detail: {state: state}}))
            },
            mediaState: function(state) {
                eventTarget.dispatchEvent(new CustomEvent("mediaState", {detail: {state: state}}))
            },
            slowLink: function(state) {
                eventTarget.dispatchEvent(new CustomEvent("slowLink", {detail: {state: state}}))
            },
            onmessage: function(message, jsep) {
                var response = {message: message, jsep: jsep}
                var index = pendingRequests.findIndex(function(request) {
                    return request.acceptResponse(response)
                })
                if (index != -1) pendingRequests.splice(index, 1)
                else eventTarget.dispatchEvent(new CustomEvent("message", {detail: {message: message, jsep: jsep}}))
            },
            onlocaltrack: function(track, added) {
                eventTarget.dispatchEvent(new CustomEvent("localtrack", {detail: {track: track, added: added}}))
            },
            onremotetrack: function(track, mid, added) {
                eventTarget.dispatchEvent(new CustomEvent("remotetrack", {detail: {track: track, mid: mid, added: added}}))
            },
            ondataopen: function(label, protocol) {
                eventTarget.dispatchEvent(new CustomEvent("dataopen", {detail: {label: label, protocol: protocol}}))
            },
            ondata: function(data, label) {
                eventTarget.dispatchEvent(new CustomEvent("data", {detail: {data: data, label: label}}))
            },
            oncleanup: function() {
                eventTarget.dispatchEvent(new CustomEvent("cleanup"))
            },
            ondetached: function() {
                eventTarget.dispatchEvent(new CustomEvent("detached"))
            }
        })
    })
    .then(function(handle) {
        handle.eventTarget = eventTarget
        handle.sendRequest = function(message) {
            return new Promise(function(fulfill, reject) {
                handle.send({
                    message: message,
                    success: fulfill,
                    error: reject
                })
            })
        }
        var pending = Promise.resolve()
        handle.sendAsyncRequest = function(request) {
            return pending = pending.catch(function() {})
                .then(function() {
                    return new Promise(function(fulfill, reject) {
                        handle.send({
                            message: request.message,
                            jsep: request.jsep,
                            success: fulfill,
                            error: reject
                        })
                    })
                    .then(function() {
                        return new Promise(function(fulfill, reject) {
                            pendingRequests.push({
                                acceptResponse: function(response) {
                                    if (response.message.videoroom == "event" && response.message.error_code) {
                                        var err = new Error(response.message.error || response.message.error_code)
                                        err.code = response.message.error_code
                                        reject(err)
                                        return true
                                    }
                                    else if (request.expectResponse(response)) {
                                        fulfill(response)
                                        return true
                                    }
                                }
                            })
                        })
                    })
                })
        }
        return handle
    })
}


/**
 * @param {JanusSession} session
 * @param {any} roomId
 * @returns {Promise<VideoRoom>}
 */
function joinVideoRoom(session, roomId) {
    return attachToPlugin(session)
        .then(function(handle) {
            return handle.sendAsyncRequest({
                message: {
                    request: "join",
                    ptype: "publisher",
                    room: roomId,
                },
                expectResponse: function(r) {
                    return r.message.videoroom == "joined" && r.message.room == roomId
                }
            })
            .then(function(response) {
                var callbacks = {
                    onPublisherAdded: null,
                    onPublisherRemoved: null,
                }
                handle.eventTarget.addEventListener("message", function(event) {
                    var message = event.detail.message
                    if (message.videoroom == "event" && message.room == roomId) {
                        if (message.publishers) {
                            if (callbacks.onPublisherAdded) callbacks.onPublisherAdded(message.publishers)
                            else console.warn("Unhandled publisherAdded event")
                        }
                        if (message.unpublished) {
                            if (callbacks.onPublisherRemoved) callbacks.onPublisherRemoved(message.unpublished)
                            else console.warn("Unhandled publisherRemoved event")
                        }
                    }
                })
                return {
                    pluginHandle: handle,
                    onPublisherAdded: function(callback) {
                        if (callbacks.onPublisherAdded) throw new Error("Already registered")
                        callbacks.onPublisherAdded = callback
                        callbacks.onPublisherAdded(response.message.publishers)
                    },
                    onPublisherRemoved: function(callback) {
                        if (callbacks.onPublisherRemoved) throw new Error("Already registered")
                        callbacks.onPublisherRemoved = callback
                    },
                    publish: function(options) {
                        return createVideoRoomPublisher(handle, options)
                    },
                    subscribe: function(streams) {
                        return createVideoRoomSubscriber(session, roomId, streams)
                    },
                    leave: function() {
                        return handle.sendAsyncRequest({
                            message: {request: "leave"},
                            expectResponse: function(r) {
                                return r.message.videoroom == "event" && r.message.leaving == "ok"
                            }
                        })
                        .then(function() {
                            return new Promise(function(fulfill, reject) {
                                handle.detach({
                                    success: fulfill,
                                    error: reject
                                })
                            })
                            .catch(console.error)
                        })
                    }
                }
            })
        })
}


/**
 * @param {JanusPluginHandleEx} handle
 * @param {any} options
 * @returns {Promise<VideoRoomPublisher>}
 */
function createVideoRoomPublisher(handle, options) {
    var callbacks = {
        onTrackAdded: null,
        onTrackRemoved: null,
    }
    handle.eventTarget.addEventListener("localtrack", function(event) {
        if (event.detail.added) {
            if (callbacks.onTrackAdded) callbacks.onTrackAdded(event.detail.track)
            else console.warn("Unhandled local trackAdded event")
        }
        else {
            if (callbacks.onTrackRemoved) callbacks.onTrackRemoved(event.detail.track)
            else console.warn("Unhandled local trackRemoved event")
        }
    })
    return new Promise(function(fulfill, reject) {
        handle.createOffer({
            success: fulfill,
            error: reject
        })
    })
    .then(function(offerJsep) {
        return handle.sendAsyncRequest({
            message: Object.assign({request: "publish"}, options),
            jsep: offerJsep,
            expectResponse: function(r) {
                return r.message.videoroom == "event" && r.message.configured == "ok"
            }
        })
    })
    .then(function(response) {
        return new Promise(function(fulfill, reject) {
            handle.handleRemoteJsep({
                jsep: response.jsep,
                success: fulfill,
                error: reject
            })
        })
    })
    .then(function() {
        return {
            onTrackAdded: function(callback) {
                if (callbacks.onTrackAdded) throw new Error("Already registered")
                callbacks.onTrackAdded = callback
            },
            onTrackRemoved: function(callback) {
                if (callbacks.onTrackRemoved) throw new Error("Already registered")
                callbacks.onTrackRemoved = callback
            },
            unpublish: function() {
                return handle.sendAsyncRequest({
                    message: {request: "unpublish"},
                    expectResponse: function(r) {
                        return r.message.videoroom == "event" && r.message.unpublished == "ok"
                    }
                })
            }
        }
    })
}


/**
 * @param {JanusSession} session
 * @param {any} roomId
 * @param {any[]} streams
 * @returns {Promise<VideoRoomSubscriber>}
 */
function createVideoRoomSubscriber(session, roomId, streams) {
    return attachToPlugin(session)
        .then(function(handle) {
            var callbacks = {
                onTrackAdded: null,
                onTrackRemoved: null,
            }
            handle.eventTarget.addEventListener("remotetrack", function(event) {
                if (event.detail.added) {
                    if (callbacks.onTrackAdded) callbacks.onTrackAdded(event.detail.track, event.detail.mid)
                    else console.warn("Unhandled remote trackAdded event")
                }
                else {
                    if (callbacks.onTrackRemoved) callbacks.onTrackRemoved(event.detail.track, event.detail.mid)
                    else console.warn("Unhandled remote trackRemoved event")
                }
            })
            return handle.sendAsyncRequest({
                message: {
                    request: "join",
                    ptype: "subscriber",
                    room: roomId,
                    streams: streams
                },
                expectResponse: function(r) {
                    return r.message.videoroom == "attached" && r.message.room == roomId
                }
            })
            .then(function(response) {
                return sendAnswer(response.jsep)
            })
            .then(function() {
                return {
                    onTrackAdded: function(callback) {
                        if (callbacks.onTrackAdded) throw new Error("Already registered")
                        callbacks.onTrackAdded = callback
                    },
                    onTrackRemoved: function(callback) {
                        if (callbacks.onTrackRemoved) throw new Error("Already registered")
                        callbacks.onTrackRemoved = callback
                    },
                    addStreams: function(streams) {
                        return handle.sendAsyncRequest({
                            message: {request: "subscribe", streams: streams},
                            expectResponse: function(r) {
                                return r.message.videoroom == "updated" && r.message.room == roomId
                            }
                        })
                        .then(function(response) {
                            if (response.jsep) sendAnswer(response.jsep)
                        })
                    },
                    removeStreams: function(streams) {
                        return handle.sendAsyncRequest({
                            message: {request: "unsubscribe", streams: streams},
                            expectResponse: function(r) {
                                return r.message.videoroom == "updated" && r.message.room == roomId
                            }
                        })
                        .then(function(response) {
                            if (response.jsep) sendAnswer(response.jsep)
                        })
                    },
                    pause: function() {
                        return handle.sendAsyncRequest({
                            message: {request: "pause"},
                            expectResponse: function(r) {
                                return r.message.videoroom == "event" && r.message.paused == "ok"
                            }
                        })
                    },
                    resume: function() {
                        return handle.sendAsyncRequest({
                            message: {request: "start"},
                            expectResponse: function(r) {
                                return r.message.videoroom == "event" && r.message.started == "ok"
                            }
                        })
                    },
                    unsubscribe: function() {
                        return handle.sendAsyncRequest({
                            message: {request: "leave"},
                            expectResponse: function(r) {
                                return r.message.videoroom == "event" && r.message.left == "ok"
                            }
                        })
                        .then(function() {
                            return new Promise(function(fulfill, reject) {
                                handle.detach({
                                    success: fulfill,
                                    error: reject
                                })
                            })
                            .catch(console.error)
                        })
                    }
                }
            })
        })

    function sendAnswer(offerJsep) {
        return new Promise(function(fulfill, reject) {
            handle.createAnswer({
                jsep: offerJsep,
                success: fulfill,
                error: reject
            })
        })
        .then(function(answerJsep) {
            return handle.sendAsyncRequest({
                message: {request: "start"},
                jsep: answerJsep,
                expectResponse: function(r) {
                    return r.message.videoroom == "event" && r.message.started == "ok"
                }
            })
        })
    }
}
