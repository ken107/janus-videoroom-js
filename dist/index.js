"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Janus = void 0;
exports.createVideoRoomClient = createVideoRoomClient;
/**
 * Remove this once janus.js properly imports webrtc-adapter.
 * Currently janus npm package depends on webrtc-adapter but does not import it, and so it gets dropped during tree shaking.
 */
const webrtc_adapter_1 = require("webrtc-adapter");
if (!window.adapter)
    window.adapter = webrtc_adapter_1.default;
const janus_gateway_1 = require("janus-gateway");
exports.Janus = janus_gateway_1.default;
function createVideoRoomClient(options) {
    return __awaiter(this, void 0, void 0, function* () {
        yield new Promise(f => janus_gateway_1.default.init(Object.assign(Object.assign({}, options), { callback: f })));
        // construct and return the VideoRoomClient object
        return {
            createSession: createVideoRoomSession
        };
    });
}
function createVideoRoomSession(server, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const eventTarget = makeEventTarget();
        let session;
        yield new Promise(function (fulfill, reject) {
            let resolved = false;
            session = new janus_gateway_1.default(Object.assign(Object.assign({}, options), { server,
                success() {
                    if (!resolved) {
                        fulfill();
                        resolved = true;
                    }
                    else {
                        //reconnected
                    }
                },
                error(err) {
                    if (!resolved) {
                        reject(err);
                        resolved = true;
                    }
                    else if (typeof err == "string" && err.startsWith("Lost connection")) {
                        eventTarget.dispatchEvent(new CustomEvent("connectionLost"));
                    }
                    else {
                        console.error(err);
                    }
                } }));
        });
        // construct and return the VideoRoomSession object
        return {
            eventTarget,
            isValid() {
                return session.isConnected();
            },
            joinRoom(roomId) {
                return joinVideoRoom(session, roomId);
            },
            subscribe(roomId, streams, options) {
                return createVideoRoomSubscriber(session, roomId, streams, options);
            },
            watch(mountPointId, options) {
                return createStreamingSubscriber(session, mountPointId, options);
            },
            attachToPlugin(plugin) {
                return attachToPlugin(session, plugin);
            },
            destroy() {
                return __awaiter(this, void 0, void 0, function* () {
                    yield new Promise(function (fulfill, reject) {
                        session.destroy({
                            success: fulfill,
                            error: reject
                        });
                    });
                });
            }
        };
    });
}
function attachToPlugin(session, plugin) {
    return __awaiter(this, void 0, void 0, function* () {
        const pendingRequests = [];
        const eventTarget = makeEventTarget();
        const handle = yield new Promise(function (fulfill, reject) {
            session.attach({
                plugin,
                success(handle) {
                    fulfill(handle);
                },
                error: reject,
                consentDialog(state) {
                    eventTarget.dispatchEvent(new CustomEvent("consentDialog", { detail: { state } }));
                },
                webrtcState(state) {
                    eventTarget.dispatchEvent(new CustomEvent("webrtcState", { detail: { state } }));
                },
                iceState(state) {
                    eventTarget.dispatchEvent(new CustomEvent("iceState", { detail: { state } }));
                },
                mediaState(state) {
                    eventTarget.dispatchEvent(new CustomEvent("mediaState", { detail: { state } }));
                },
                slowLink(state) {
                    eventTarget.dispatchEvent(new CustomEvent("slowLink", { detail: { state } }));
                },
                onmessage(message, jsep) {
                    const response = { message, jsep };
                    const index = pendingRequests.findIndex(x => x.acceptResponse(response));
                    if (index != -1)
                        pendingRequests.splice(index, 1);
                    else
                        eventTarget.dispatchEvent(new CustomEvent("message", { detail: { message, jsep } }));
                },
                onlocaltrack(track, added) {
                    eventTarget.dispatchEvent(new CustomEvent("localtrack", { detail: { track, added } }));
                },
                onremotetrack(track, mid, added) {
                    eventTarget.dispatchEvent(new CustomEvent("remotetrack", { detail: { track, mid, added } }));
                },
                ondataopen(label, protocol) {
                    eventTarget.dispatchEvent(new CustomEvent("dataopen", { detail: { label, protocol } }));
                },
                ondata(data, label) {
                    eventTarget.dispatchEvent(new CustomEvent("data", { detail: { data, label } }));
                },
                oncleanup() {
                    eventTarget.dispatchEvent(new CustomEvent("cleanup"));
                },
                ondetached() {
                    eventTarget.dispatchEvent(new CustomEvent("detached"));
                }
            });
        });
        // extend the handle to add convenience methods
        handle.eventTarget = eventTarget;
        // method to send a synchrnous request to the plugin
        handle.sendRequest = function (message) {
            return new Promise(function (fulfill, reject) {
                handle.send({
                    message,
                    success: fulfill,
                    error: reject
                });
            });
        };
        // method to send an asynchronous request to the plugin
        let pending = Promise.resolve();
        handle.sendAsyncRequest = function (request) {
            const promise = pending.catch(function () { })
                .then(function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield new Promise(function (fulfill, reject) {
                        handle.send({
                            message: request.message,
                            jsep: request.jsep,
                            success: fulfill,
                            error: reject
                        });
                    });
                    return new Promise(function (fulfill, reject) {
                        pendingRequests.push({
                            acceptResponse(response) {
                                if ((response.message.videoroom == "event" || response.message.streaming == "event") && response.message.error_code) {
                                    const err = new Error(response.message.error || response.message.error_code);
                                    err.code = response.message.error_code;
                                    reject(err);
                                    return true;
                                }
                                else if (request.expectResponse(response)) {
                                    fulfill(response);
                                    return true;
                                }
                                else {
                                    return false;
                                }
                            }
                        });
                    });
                });
            });
            pending = promise;
            return promise;
        };
        return handle;
    });
}
function joinVideoRoom(session, roomId) {
    return __awaiter(this, void 0, void 0, function* () {
        const cleanup = makeCleanup();
        const callbacks = makeCallbacks();
        try {
            // attach to plugin and get a new handle for this room
            const handle = yield attachToPlugin(session, "janus.plugin.videoroom");
            // remember to detach
            cleanup.add(function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield new Promise(function (fulfill, reject) {
                        handle.detach({
                            success: fulfill,
                            error: reject
                        });
                    });
                });
            });
            // listen to events and invoke callbacks
            handle.eventTarget.addEventListener("message", function (event) {
                const message = event.detail.message;
                if (message.videoroom == "event" && message.room == roomId) {
                    if (message.publishers) {
                        callbacks.get("onPublisherAdded")
                            .then(callback => callback(message.publishers))
                            .catch(console.error);
                    }
                    if (message.unpublished) {
                        callbacks.get("onPublisherRemoved")
                            .then(callback => callback(message.unpublished))
                            .catch(console.error);
                    }
                }
            });
            // send the join request
            const response = yield handle.sendAsyncRequest({
                message: {
                    request: "join",
                    ptype: "publisher",
                    room: roomId,
                },
                expectResponse: r => r.message.videoroom == "joined" && r.message.room == roomId
            });
            // invoke callback with the initial list of publishers
            if (response.message.publishers.length) {
                callbacks.get("onPublisherAdded")
                    .then(callback => callback(response.message.publishers))
                    .catch(console.error);
            }
            // construct and return the VideoRoom object
            return {
                roomId,
                pluginHandle: handle,
                onPublisherAdded(callback) {
                    callbacks.set("onPublisherAdded", callback);
                },
                onPublisherRemoved(callback) {
                    callbacks.set("onPublisherRemoved", callback);
                },
                publish(options) {
                    return createVideoRoomPublisher(handle, response.message.id, options);
                },
                subscribe(streams, options) {
                    return createVideoRoomSubscriber(session, roomId, streams, options);
                },
                leave() {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield cleanup.run();
                    });
                }
            };
        }
        catch (err) {
            yield cleanup.run().catch(console.error);
            throw err;
        }
    });
}
function createVideoRoomPublisher(handle, publisherId, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = Object.assign({}, opts);
        const cleanup = makeCleanup();
        const callbacks = makeCallbacks();
        // listen to events and invoke callbacks
        const onLocalTrack = function (event) {
            if (event.detail.added) {
                callbacks.get("onTrackAdded")
                    .then(callback => callback(event.detail.track))
                    .catch(console.error);
            }
            else {
                callbacks.get("onTrackRemoved")
                    .then(callback => callback(event.detail.track))
                    .catch(console.error);
            }
        };
        handle.eventTarget.addEventListener("localtrack", onLocalTrack);
        // remember to remove the event listener
        cleanup.add(function () {
            handle.eventTarget.removeEventListener("localtrack", onLocalTrack);
        });
        try {
            // send the publish request
            const offerJsep = yield new Promise(function (fulfill, reject) {
                // the offer (local) sdp can be customized via mediaOptions.customizeSdp
                handle.createOffer(Object.assign(Object.assign({}, options.mediaOptions), { success: fulfill, error: reject }));
            });
            const response = yield handle.sendAsyncRequest({
                message: Object.assign(Object.assign({}, options.publishOptions), { request: "publish" }),
                jsep: offerJsep,
                expectResponse: r => r.message.videoroom == "event" && r.message.configured == "ok"
            });
            // remember to unpublish
            cleanup.add(function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield handle.sendAsyncRequest({
                        message: { request: "unpublish" },
                        expectResponse: r => r.message.videoroom == "event" && r.message.unpublished == "ok"
                    });
                });
            });
            // handle the answer JSEP
            yield new Promise(function (fulfill, reject) {
                var _a;
                handle.handleRemoteJsep({
                    jsep: response.jsep,
                    success: fulfill,
                    error: reject,
                    customizeSdp: (_a = options.mediaOptions) === null || _a === void 0 ? void 0 : _a.customizeRemoteSdp
                });
            });
            // construct and return the VideoRoomPublisher object
            return {
                publisherId,
                onTrackAdded(callback) {
                    callbacks.set("onTrackAdded", callback);
                },
                onTrackRemoved(callback) {
                    callbacks.set("onTrackRemoved", callback);
                },
                configure(configureOptions) {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield handle.sendAsyncRequest({
                            message: Object.assign(Object.assign({}, configureOptions), { request: "configure" }),
                            expectResponse: r => r.message.videoroom == "event" && r.message.configured == "ok"
                        });
                    });
                },
                restart() {
                    return __awaiter(this, arguments, void 0, function* (mediaOptions = options.mediaOptions, publishOptions) {
                        const offerJsep = yield new Promise(function (fulfill, reject) {
                            handle.createOffer(Object.assign(Object.assign({}, mediaOptions), { success: fulfill, error: reject }));
                        });
                        const response = yield handle.sendAsyncRequest({
                            message: Object.assign(Object.assign({}, publishOptions), { request: "configure" }),
                            jsep: offerJsep,
                            expectResponse: r => r.message.videoroom == "event" && r.message.configured == "ok"
                        });
                        yield new Promise(function (fulfill, reject) {
                            handle.handleRemoteJsep({
                                jsep: response.jsep,
                                customizeSdp: mediaOptions === null || mediaOptions === void 0 ? void 0 : mediaOptions.customizeRemoteSdp,
                                success: fulfill,
                                error: reject
                            });
                        });
                        options.mediaOptions = mediaOptions;
                    });
                },
                unpublish() {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield cleanup.run();
                    });
                }
            };
        }
        catch (err) {
            yield cleanup.run().catch(console.error);
            throw err;
        }
    });
}
function createVideoRoomSubscriber(session, roomId, streams, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = Object.assign({}, opts);
        const cleanup = makeCleanup();
        const callbacks = makeCallbacks();
        try {
            // attach to plugin and get a separate handle for this subscriber
            const handle = yield attachToPlugin(session, "janus.plugin.videoroom");
            // remember to detach
            cleanup.add(function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield new Promise(function (fulfill, reject) {
                        handle.detach({
                            success: fulfill,
                            error: reject
                        });
                    });
                });
            });
            // listen to events and invoke callbacks
            handle.eventTarget.addEventListener("remotetrack", function (event) {
                if (event.detail.added) {
                    callbacks.get("onTrackAdded")
                        .then(callback => callback(event.detail.track, event.detail.mid))
                        .catch(console.error);
                }
                else {
                    callbacks.get("onTrackRemoved")
                        .then(callback => callback(event.detail.track, event.detail.mid))
                        .catch(console.error);
                }
            });
            // join the room as a subscriber
            const response = yield handle.sendAsyncRequest({
                message: {
                    request: "join",
                    ptype: "subscriber",
                    room: roomId,
                    streams
                },
                expectResponse: r => r.message.videoroom == "attached" && r.message.room == roomId
            });
            if (!response.jsep)
                throw new Error("Missing offer Jsep");
            yield handleOffer(handle, response.jsep, options.mediaOptions);
            // construct and return the VideoRoomSubscriber object
            return {
                pluginHandle: handle,
                onTrackAdded(callback) {
                    callbacks.set("onTrackAdded", callback);
                },
                onTrackRemoved(callback) {
                    callbacks.set("onTrackRemoved", callback);
                },
                addStreams(streams) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const response = yield handle.sendAsyncRequest({
                            message: { request: "subscribe", streams },
                            expectResponse: r => r.message.videoroom == "updated" && r.message.room == roomId
                        });
                        if (response.jsep)
                            yield handleOffer(handle, response.jsep, options.mediaOptions);
                    });
                },
                removeStreams(streams) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const response = yield handle.sendAsyncRequest({
                            message: { request: "unsubscribe", streams },
                            expectResponse: r => r.message.videoroom == "updated" && r.message.room == roomId
                        });
                        if (response.jsep)
                            yield handleOffer(handle, response.jsep, options.mediaOptions);
                    });
                },
                pause() {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield handle.sendAsyncRequest({
                            message: { request: "pause" },
                            expectResponse: r => r.message.videoroom == "event" && r.message.paused == "ok"
                        });
                    });
                },
                resume() {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield handle.sendAsyncRequest({
                            message: { request: "start" },
                            expectResponse: r => r.message.videoroom == "event" && r.message.started == "ok"
                        });
                    });
                },
                configure(configureOptions) {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield handle.sendAsyncRequest({
                            message: Object.assign(Object.assign({}, configureOptions), { request: "configure", restart: false }),
                            expectResponse: r => r.message.videoroom == "event" && r.message.configured == "ok"
                        });
                    });
                },
                restart() {
                    return __awaiter(this, arguments, void 0, function* (mediaOptions = options.mediaOptions) {
                        const response = yield handle.sendAsyncRequest({
                            message: {
                                request: "configure",
                                restart: true
                            },
                            expectResponse: r => r.message.videoroom == "event" && r.message.configured == "ok"
                        });
                        if (!response.jsep)
                            throw new Error("Missing offer Jsep");
                        yield handleOffer(handle, response.jsep, mediaOptions);
                        options.mediaOptions = mediaOptions;
                    });
                },
                unsubscribe() {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield cleanup.run();
                    });
                }
            };
        }
        catch (err) {
            yield cleanup.run().catch(console.error);
            throw err;
        }
    });
}
function createStreamingSubscriber(session, mountPointId, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const cleanup = makeCleanup();
        const callbacks = makeCallbacks();
        try {
            // attach to the streaming plugin
            const handle = yield attachToPlugin(session, "janus.plugin.streaming");
            // remember to detach
            cleanup.add(function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield new Promise(function (fulfill, reject) {
                        handle.detach({
                            success: fulfill,
                            error: reject
                        });
                    });
                });
            });
            // listen to events and invoke callbacks
            handle.eventTarget.addEventListener("remotetrack", function (event) {
                if (event.detail.added) {
                    callbacks.get("onTrackAdded")
                        .then(callback => callback(event.detail.track, event.detail.mid))
                        .catch(console.error);
                }
                else {
                    callbacks.get("onTrackRemoved")
                        .then(callback => callback(event.detail.track, event.detail.mid))
                        .catch(console.error);
                }
            });
            // send the watch request
            const response = yield handle.sendAsyncRequest({
                message: Object.assign(Object.assign({}, options === null || options === void 0 ? void 0 : options.watchOptions), { request: "watch", id: mountPointId }),
                expectResponse: r => { var _a; return r.message.streaming == "event" && ((_a = r.message.result) === null || _a === void 0 ? void 0 : _a.status) == "preparing"; }
            });
            if (!response.jsep)
                throw new Error("Missing offer Jsep");
            yield handleOffer(handle, response.jsep, options === null || options === void 0 ? void 0 : options.mediaOptions);
            // construct and return the StreamingSubscriber object
            return {
                pluginHandle: handle,
                onTrackAdded(callback) {
                    callbacks.set("onTrackAdded", callback);
                },
                onTrackRemoved(callback) {
                    callbacks.set("onTrackRemoved", callback);
                },
                pause() {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield handle.sendAsyncRequest({
                            message: { request: "pause" },
                            expectResponse: r => { var _a; return r.message.streaming == "event" && ((_a = r.message.result) === null || _a === void 0 ? void 0 : _a.status) == "pausing"; }
                        });
                    });
                },
                resume() {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield handle.sendAsyncRequest({
                            message: { request: "start" },
                            expectResponse: r => { var _a; return r.message.streaming == "event" && ((_a = r.message.result) === null || _a === void 0 ? void 0 : _a.status) == "starting"; }
                        });
                    });
                },
                configure(configureOptions) {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield handle.sendAsyncRequest({
                            message: Object.assign(Object.assign({}, configureOptions), { request: "configure" }),
                            expectResponse: r => { var _a; return r.message.streaming == "event" && ((_a = r.message.result) === null || _a === void 0 ? void 0 : _a.event) == "configured"; }
                        });
                    });
                },
                switch(newMountPointId) {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield handle.sendAsyncRequest({
                            message: {
                                request: "switch",
                                id: newMountPointId
                            },
                            expectResponse: r => { var _a; return r.message.streaming == "event" && ((_a = r.message.result) === null || _a === void 0 ? void 0 : _a.switched) == "ok"; }
                        });
                        mountPointId = newMountPointId;
                    });
                },
                restart() {
                    return __awaiter(this, arguments, void 0, function* (newOptions = options) {
                        const response = yield handle.sendAsyncRequest({
                            message: Object.assign(Object.assign({}, newOptions === null || newOptions === void 0 ? void 0 : newOptions.watchOptions), { request: "watch", id: mountPointId }),
                            expectResponse: r => { var _a; return r.message.streaming == "event" && ((_a = r.message.result) === null || _a === void 0 ? void 0 : _a.status) == "preparing"; }
                        });
                        if (!response.jsep)
                            throw new Error("Missing offer Jsep");
                        yield handleOffer(handle, response.jsep, newOptions === null || newOptions === void 0 ? void 0 : newOptions.mediaOptions);
                        options = newOptions;
                    });
                },
                unsubscribe() {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield cleanup.run();
                    });
                }
            };
        }
        catch (err) {
            yield cleanup.run().catch(console.error);
            throw err;
        }
    });
}
function handleOffer(handle, offerJsep, mediaOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        // allow customizing the remote (offer) sdp
        if (mediaOptions === null || mediaOptions === void 0 ? void 0 : mediaOptions.customizeRemoteSdp) {
            mediaOptions.customizeRemoteSdp(offerJsep);
        }
        // create and send the answer
        const answerJsep = yield new Promise(function (fulfill, reject) {
            // the answer (local) sdp can be customized via mediaOptions.customizeSdp
            handle.createAnswer(Object.assign(Object.assign({}, mediaOptions), { jsep: offerJsep, success: fulfill, error: reject }));
        });
        yield handle.sendAsyncRequest({
            message: { request: "start" },
            jsep: answerJsep,
            expectResponse: r => {
                var _a;
                return r.message.videoroom == "event" && r.message.started == "ok" ||
                    r.message.streaming == "event" && ((_a = r.message.result) === null || _a === void 0 ? void 0 : _a.status) == "started";
            }
        });
    });
}
function makeCleanup() {
    const tasks = [];
    return {
        add(task) {
            tasks.push(task);
        },
        run() {
            let promise = Promise.resolve();
            for (let i = tasks.length - 1; i >= 0; i--)
                promise = promise.then(tasks[i]);
            return promise;
        }
    };
}
function makeCallbacks() {
    const pending = {};
    const getPending = (name) => {
        if (!pending[name]) {
            let fulfill = function (_) { };
            const promise = new Promise(f => fulfill = f);
            pending[name] = { promise, fulfill };
        }
        return pending[name];
    };
    return {
        get(name) {
            return getPending(name).promise;
        },
        set(name, value) {
            getPending(name).fulfill(value);
        }
    };
}
function makeEventTarget() {
    const listeners = {};
    return {
        addEventListener(name, callback) {
            if (!listeners[name])
                listeners[name] = [];
            listeners[name].push(callback);
        },
        removeEventListener(name, callback) {
            if (!listeners[name])
                return;
            const index = listeners[name].indexOf(callback);
            if (index >= 0)
                listeners[name].splice(index, 1);
        },
        dispatchEvent(event) {
            if (!listeners[event.type])
                return;
            for (let i = 0; i < listeners[event.type].length; i++) {
                listeners[event.type][i](event);
            }
        }
    };
}
