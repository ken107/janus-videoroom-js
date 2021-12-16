/**
 * @typedef {Object} VideoRoomClient
 * @property {(server: string|string[], options?: JanusSessionOptions) => Promise<VideoRoomSession>} createSession
 */

/**
 * @typedef {Object} VideoRoomSession
 * @property {() => boolean} isValid
 * @property {(roomId: string|number) => Promise<VideoRoom>} joinRoom
 * @property {() => Promise<JanusPluginHandleEx>} attachToPlugin
 */

/**
 * @typedef {Object} VideoRoom
 * @property {JanusPluginHandleEx} pluginHandle
 * @property {(callback: (publishers: any[]) => void) => void} onPublisherAdded
 * @property {(callback: (publisherId: any) => void) => void} onPublisherRemoved
 * @property {(options?: {publishOptions?: JanusPublishOptions, mediaOptions?: JanusMediaOptions}) => Promise<VideoRoomPublisher>} publish
 * @property {(streams: JanusStreamSpec[], options?: {mediaOptions?: JanusMediaOptions}) => Promise<VideoRoomSubscriber>} subscribe
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
 * @property {(streams: JanusStreamSpec[]) => Promise<void>} addStreams
 * @property {(streams: JanusStreamSpec[]) => Promise<void>} removeStreams
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
 * @typedef {Object} JanusStreamSpec
 * @property {any} feed
 * @property {any} [mid]
 */

/**
 * @typedef {Object} JanusSessionOptions
 * @property {string[]} [iceServers]
 * @property {boolean} [ipv6]
 * @property {boolean} [withCredentials]
 * @property {number} [max_poll_events]
 * @property {boolean} [destroyOnUnload]
 * @property {any} [token]
 * @property {string} [apisecret]
 */

/**
 * @typedef {Object} JanusPublishOptions
 * @property {string} [audiocodec]
 * @property {string} [videocodec]
 * @property {number} [bitrate]
 * @property {boolean} [record]
 * @property {string} [filename]
 * @property {string} [display]
 * @property {number} [audio_level_average]
 * @property {number} [audio_active_packets]
 * @property {{mid: any, description: string}[]} [descriptions]
 */

/**
 * @typedef {Object} JanusMediaOptions
 * @property {Object} [media]
 * @property {boolean} [media.audioSend]
 * @property {boolean} [media.audioRecv]
 * @property {boolean|{deviceId: any}} [media.audio]
 * @property {boolean} [media.videoSend]
 * @property {boolean} [media.videoRecv]
 * @property {string|{deviceId: any, width?: number, height?: number}} [media.video]
 * @property {boolean} [media.data]
 * @property {boolean} [media.failIfNoAudio]
 * @property {boolean} [media.failIfNoVideo]
 * @property {number} [media.screenshareFrameRate]
 * @property {boolean} [trickle]
 * @property {MediaStream} [stream]
 */



/**
 * @param {Object} [options]
 * @param {boolean|string[]} [options.debug]
 * @param {any} [options.dependencies]
 * @returns {Promise<VideoRoomClient>}
 */
function createVideoRoomClient(options) {
    return new Promise(function(fulfill) {
        Janus.init(Object.assign({}, options, {
            callback: fulfill
        }))
    })
    .then(function() {
        return {
            createSession: function(server, options) {
                return createVideoRoomSession(server, options)
            }
        }
    })
}


/**
 * @param {string|string[]} server
 * @param {JanusSessionOptions} [options]
 * @returns {Promise<VideoRoomSession>}
 */
function createVideoRoomSession(server, options) {
    var isDestroyed = false
    return new Promise(function(fulfill, reject) {
        var session = new Janus(Object.assign({}, options, {
            server: server,
            success: function() {
                fulfill(session)
            },
            error: reject,
            destroyed: function() {
                isDestroyed = true
            }
        }))
    })
    .then(function(session) {
        return {
            isValid: function() {
                return !isDestroyed
            },
            joinRoom: function(roomId) {
                return joinVideoRoom(session, roomId)
            },
            attachToPlugin: function() {
                return attachToPlugin(session)
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
 * @param {string|number} roomId
 * @returns {Promise<VideoRoom>}
 */
function joinVideoRoom(session, roomId) {
    return attachToPlugin(session)
        .then(function(handle) {
            var callbacks = makeCallbacks()
            handle.eventTarget.addEventListener("message", function(event) {
                var message = event.detail.message
                if (message.videoroom == "event" && message.room == roomId) {
                    if (message.publishers) {
                        callbacks.get("onPublisherAdded")
                            .then(function(callback) { return callback(message.publishers) })
                            .catch(console.error)
                    }
                    if (message.unpublished) {
                        callbacks.get("onPublisherRemoved")
                            .then(function(callback) { return callback(message.unpublished) })
                            .catch(console.error)
                    }
                }
            })
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
                if (response.message.publishers.length) {
                    callbacks.get("onPublisherAdded")
                        .then(function(callback) { return callback(response.message.publishers) })
                        .catch(console.error)
                }
                return {
                    pluginHandle: handle,
                    onPublisherAdded: function(callback) {
                        callbacks.set("onPublisherAdded", callback)
                    },
                    onPublisherRemoved: function(callback) {
                        callbacks.set("onPublisherRemoved", callback)
                    },
                    publish: function(options) {
                        return createVideoRoomPublisher(handle, options)
                    },
                    subscribe: function(streams, options) {
                        return createVideoRoomSubscriber(session, roomId, streams, options)
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
 * @param {Object} [options]
 * @param {JanusPublishOptions} [options.publishOptions]
 * @param {JanusMediaOptions} [options.mediaOptions]
 * @returns {Promise<VideoRoomPublisher>}
 */
function createVideoRoomPublisher(handle, options) {
    options = options || {}
    var callbacks = makeCallbacks()
    handle.eventTarget.addEventListener("localtrack", function(event) {
        if (event.detail.added) {
            callbacks.get("onTrackAdded")
                .then(function(callback) { return callback(event.detail.track) })
                .catch(console.error)
        }
        else {
            callbacks.get("onTrackRemoved")
                .then(function(callback) { return callback(event.detail.track) })
                .catch(console.error)
        }
    })
    return new Promise(function(fulfill, reject) {
        handle.createOffer(Object.assign({}, options.mediaOptions, {
            success: fulfill,
            error: reject
        }))
    })
    .then(function(offerJsep) {
        return handle.sendAsyncRequest({
            message: Object.assign({}, options.publishOptions, {
                request: "publish"
            }),
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
                callbacks.set("onTrackAdded", callback)
            },
            onTrackRemoved: function(callback) {
                callbacks.set("onTrackRemoved", callback)
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
 * @param {string|number} roomId
 * @param {JanusStreamSpec[]} streams
 * @param {Object} [options]
 * @param {JanusMediaOptions} [options.mediaOptions]
 * @returns {Promise<VideoRoomSubscriber>}
 */
function createVideoRoomSubscriber(session, roomId, streams, options) {
    options = options || {}
    return attachToPlugin(session)
        .then(function(handle) {
            var callbacks = makeCallbacks()
            handle.eventTarget.addEventListener("remotetrack", function(event) {
                if (event.detail.added) {
                    callbacks.get("onTrackAdded")
                        .then(function(callback) { return callback(event.detail.track, event.detail.mid) })
                        .catch(console.error)
                }
                else {
                    callbacks.get("onTrackRemoved")
                        .then(function(callback) { return callback(event.detail.track, event.detail.mid) })
                        .catch(console.error)
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
                return handleOffer(response.jsep)
            })
            .then(function() {
                return {
                    onTrackAdded: function(callback) {
                        callbacks.set("onTrackAdded", callback)
                    },
                    onTrackRemoved: function(callback) {
                        callbacks.set("onTrackRemoved", callback)
                    },
                    addStreams: function(streams) {
                        return handle.sendAsyncRequest({
                            message: {request: "subscribe", streams: streams},
                            expectResponse: function(r) {
                                return r.message.videoroom == "updated" && r.message.room == roomId
                            }
                        })
                        .then(function(response) {
                            if (response.jsep) return handleOffer(response.jsep)
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
                            if (response.jsep) return handleOffer(response.jsep)
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
                        return new Promise(function(fulfill, reject) {
                            handle.detach({
                                success: fulfill,
                                error: reject
                            })
                        })
                        .catch(console.error)
                    }
                }
            })

            function handleOffer(offerJsep) {
                return new Promise(function(fulfill, reject) {
                    handle.createAnswer(Object.assign({}, options.mediaOptions, {
                        jsep: offerJsep,
                        success: fulfill,
                        error: reject
                    }))
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
        })
}


function makeCallbacks() {
    var promises = {}
    return {
        get: function(name) {
            if (!promises[name]) {
                var fulfill
                promises[name] = new Promise(function(f) { fulfill = f })
                promises[name].fulfill = fulfill
            }
            return promises[name]
        },
        set: function(name, value) {
            this.get(name).fulfill(value)
        }
    }
}
