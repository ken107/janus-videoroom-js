"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVideoRoomClient = void 0;
function createVideoRoomClient(options) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (f) { return Janus.init(__assign(__assign({}, options), { callback: f })); })
                    // construct and return the VideoRoomClient object
                ];
                case 1:
                    _a.sent();
                    // construct and return the VideoRoomClient object
                    return [2 /*return*/, {
                            createSession: createVideoRoomSession
                        }];
            }
        });
    });
}
exports.createVideoRoomClient = createVideoRoomClient;
function createVideoRoomSession(server, options) {
    return __awaiter(this, void 0, void 0, function () {
        var eventTarget, session;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    eventTarget = makeEventTarget();
                    return [4 /*yield*/, new Promise(function (fulfill, reject) {
                            var resolved = false;
                            session = new Janus(__assign(__assign({}, options), { server: server, success: function () {
                                    if (!resolved) {
                                        fulfill();
                                        resolved = true;
                                    }
                                    else {
                                        //reconnected
                                    }
                                }, error: function (err) {
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
                        })
                        // construct and return the VideoRoomSession object
                    ];
                case 1:
                    _a.sent();
                    // construct and return the VideoRoomSession object
                    return [2 /*return*/, {
                            eventTarget: eventTarget,
                            isValid: function () {
                                return session.isConnected();
                            },
                            joinRoom: function (roomId) {
                                return joinVideoRoom(session, roomId);
                            },
                            subscribe: function (roomId, streams, options) {
                                return createVideoRoomSubscriber(session, roomId, streams, options);
                            },
                            watch: function (mountPointId, options) {
                                return createStreamingSubscriber(session, mountPointId, options);
                            },
                            attachToPlugin: function (plugin) {
                                return attachToPlugin(session, plugin);
                            },
                            destroy: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, new Promise(function (fulfill, reject) {
                                                    session.destroy({
                                                        success: fulfill,
                                                        error: reject
                                                    });
                                                })];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            }
                        }];
            }
        });
    });
}
function attachToPlugin(session, plugin) {
    return __awaiter(this, void 0, void 0, function () {
        var pendingRequests, eventTarget, handle, pending;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pendingRequests = [];
                    eventTarget = makeEventTarget();
                    return [4 /*yield*/, new Promise(function (fulfill, reject) {
                            session.attach({
                                plugin: plugin,
                                success: fulfill,
                                error: reject,
                                consentDialog: function (state) {
                                    eventTarget.dispatchEvent(new CustomEvent("consentDialog", { detail: { state: state } }));
                                },
                                webrtcState: function (state, reason) {
                                    eventTarget.dispatchEvent(new CustomEvent("webrtcState", { detail: { state: state, reason: reason } }));
                                },
                                iceState: function (state) {
                                    eventTarget.dispatchEvent(new CustomEvent("iceState", { detail: { state: state } }));
                                },
                                mediaState: function (state) {
                                    eventTarget.dispatchEvent(new CustomEvent("mediaState", { detail: { state: state } }));
                                },
                                slowLink: function (state) {
                                    eventTarget.dispatchEvent(new CustomEvent("slowLink", { detail: { state: state } }));
                                },
                                onmessage: function (message, jsep) {
                                    var response = { message: message, jsep: jsep };
                                    var index = pendingRequests.findIndex(function (x) { return x.acceptResponse(response); });
                                    if (index != -1)
                                        pendingRequests.splice(index, 1);
                                    else
                                        eventTarget.dispatchEvent(new CustomEvent("message", { detail: { message: message, jsep: jsep } }));
                                },
                                onlocaltrack: function (track, added) {
                                    eventTarget.dispatchEvent(new CustomEvent("localtrack", { detail: { track: track, added: added } }));
                                },
                                onremotetrack: function (track, mid, added) {
                                    eventTarget.dispatchEvent(new CustomEvent("remotetrack", { detail: { track: track, mid: mid, added: added } }));
                                },
                                ondataopen: function (label, protocol) {
                                    eventTarget.dispatchEvent(new CustomEvent("dataopen", { detail: { label: label, protocol: protocol } }));
                                },
                                ondata: function (data, label) {
                                    eventTarget.dispatchEvent(new CustomEvent("data", { detail: { data: data, label: label } }));
                                },
                                oncleanup: function () {
                                    eventTarget.dispatchEvent(new CustomEvent("cleanup"));
                                },
                                ondetached: function () {
                                    eventTarget.dispatchEvent(new CustomEvent("detached"));
                                }
                            });
                        })
                        // extend the handle to add convenience methods
                    ];
                case 1:
                    handle = _a.sent();
                    // extend the handle to add convenience methods
                    handle.eventTarget = eventTarget;
                    // method to send a synchrnous request to the plugin
                    handle.sendRequest = function (message) {
                        return new Promise(function (fulfill, reject) {
                            handle.send({
                                message: message,
                                success: fulfill,
                                error: reject
                            });
                        });
                    };
                    pending = Promise.resolve();
                    handle.sendAsyncRequest = function (request) {
                        var promise = pending.catch(function () { })
                            .then(function () {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, new Promise(function (fulfill, reject) {
                                                handle.send({
                                                    message: request.message,
                                                    jsep: request.jsep,
                                                    success: fulfill,
                                                    error: reject
                                                });
                                            })];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/, new Promise(function (fulfill, reject) {
                                                    pendingRequests.push({
                                                        acceptResponse: function (response) {
                                                            if ((response.message.videoroom == "event" || response.message.streaming == "event") && response.message.error_code) {
                                                                var err = new Error(response.message.error || response.message.error_code);
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
                                                })];
                                    }
                                });
                            });
                        });
                        pending = promise;
                        return promise;
                    };
                    return [2 /*return*/, handle];
            }
        });
    });
}
function joinVideoRoom(session, roomId) {
    return __awaiter(this, void 0, void 0, function () {
        var cleanup, callbacks, handle_1, response_1, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cleanup = makeCleanup();
                    callbacks = makeCallbacks();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 6]);
                    return [4 /*yield*/, attachToPlugin(session, "janus.plugin.videoroom")
                        // remember to detach
                    ];
                case 2:
                    handle_1 = _a.sent();
                    // remember to detach
                    cleanup.add(function () {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, new Promise(function (fulfill, reject) {
                                            handle_1.detach({
                                                success: fulfill,
                                                error: reject
                                            });
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    });
                    // listen to events and invoke callbacks
                    handle_1.eventTarget.addEventListener("message", function (event) {
                        var message = event.detail.message;
                        if (message.videoroom == "event" && message.room == roomId) {
                            if (message.publishers) {
                                callbacks.get("onPublisherAdded")
                                    .then(function (callback) { return callback(message.publishers); })
                                    .catch(console.error);
                            }
                            if (message.unpublished) {
                                callbacks.get("onPublisherRemoved")
                                    .then(function (callback) { return callback(message.unpublished); })
                                    .catch(console.error);
                            }
                        }
                    });
                    return [4 /*yield*/, handle_1.sendAsyncRequest({
                            message: {
                                request: "join",
                                ptype: "publisher",
                                room: roomId,
                            },
                            expectResponse: function (r) { return r.message.videoroom == "joined" && r.message.room == roomId; }
                        })
                        // invoke callback with the initial list of publishers
                    ];
                case 3:
                    response_1 = _a.sent();
                    // invoke callback with the initial list of publishers
                    if (response_1.message.publishers.length) {
                        callbacks.get("onPublisherAdded")
                            .then(function (callback) { return callback(response_1.message.publishers); })
                            .catch(console.error);
                    }
                    // construct and return the VideoRoom object
                    return [2 /*return*/, {
                            roomId: roomId,
                            pluginHandle: handle_1,
                            onPublisherAdded: function (callback) {
                                callbacks.set("onPublisherAdded", callback);
                            },
                            onPublisherRemoved: function (callback) {
                                callbacks.set("onPublisherRemoved", callback);
                            },
                            publish: function (options) {
                                return createVideoRoomPublisher(handle_1, response_1.message.id, options);
                            },
                            subscribe: function (streams, options) {
                                return createVideoRoomSubscriber(session, roomId, streams, options);
                            },
                            leave: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, cleanup.run()];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            }
                        }];
                case 4:
                    err_1 = _a.sent();
                    return [4 /*yield*/, cleanup.run().catch(console.error)];
                case 5:
                    _a.sent();
                    throw err_1;
                case 6: return [2 /*return*/];
            }
        });
    });
}
function createVideoRoomPublisher(handle, publisherId, opts) {
    return __awaiter(this, void 0, void 0, function () {
        var options, cleanup, callbacks, onLocalTrack, offerJsep, response_2, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = __assign({}, opts);
                    cleanup = makeCleanup();
                    callbacks = makeCallbacks();
                    onLocalTrack = function (event) {
                        if (event.detail.added) {
                            callbacks.get("onTrackAdded")
                                .then(function (callback) { return callback(event.detail.track); })
                                .catch(console.error);
                        }
                        else {
                            callbacks.get("onTrackRemoved")
                                .then(function (callback) { return callback(event.detail.track); })
                                .catch(console.error);
                        }
                    };
                    handle.eventTarget.addEventListener("localtrack", onLocalTrack);
                    // remember to remove the event listener
                    cleanup.add(function () {
                        handle.eventTarget.removeEventListener("localtrack", onLocalTrack);
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 7]);
                    return [4 /*yield*/, new Promise(function (fulfill, reject) {
                            // the offer (local) sdp can be customized via mediaOptions.customizeSdp
                            handle.createOffer(__assign(__assign({}, options.mediaOptions), { success: fulfill, error: reject }));
                        })];
                case 2:
                    offerJsep = _a.sent();
                    return [4 /*yield*/, handle.sendAsyncRequest({
                            message: __assign(__assign({}, options.publishOptions), { request: "publish" }),
                            jsep: offerJsep,
                            expectResponse: function (r) { return r.message.videoroom == "event" && r.message.configured == "ok"; }
                        })
                        // remember to unpublish
                    ];
                case 3:
                    response_2 = _a.sent();
                    // remember to unpublish
                    cleanup.add(function () {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, handle.sendAsyncRequest({
                                            message: { request: "unpublish" },
                                            expectResponse: function (r) { return r.message.videoroom == "event" && r.message.unpublished == "ok"; }
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    });
                    // handle the answer JSEP
                    return [4 /*yield*/, new Promise(function (fulfill, reject) {
                            var _a;
                            handle.handleRemoteJsep({
                                jsep: response_2.jsep,
                                success: fulfill,
                                error: reject,
                                customizeSdp: (_a = options.mediaOptions) === null || _a === void 0 ? void 0 : _a.customizeRemoteSdp
                            });
                        })
                        // construct and return the VideoRoomPublisher object
                    ];
                case 4:
                    // handle the answer JSEP
                    _a.sent();
                    // construct and return the VideoRoomPublisher object
                    return [2 /*return*/, {
                            publisherId: publisherId,
                            onTrackAdded: function (callback) {
                                callbacks.set("onTrackAdded", callback);
                            },
                            onTrackRemoved: function (callback) {
                                callbacks.set("onTrackRemoved", callback);
                            },
                            configure: function (configureOptions) {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, handle.sendAsyncRequest({
                                                    message: __assign(__assign({}, configureOptions), { request: "configure" }),
                                                    expectResponse: function (r) { return r.message.videoroom == "event" && r.message.configured == "ok"; }
                                                })];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                            restart: function (mediaOptions) {
                                if (mediaOptions === void 0) { mediaOptions = options.mediaOptions; }
                                return __awaiter(this, void 0, void 0, function () {
                                    var offerJsep, response;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, new Promise(function (fulfill, reject) {
                                                    handle.createOffer(__assign(__assign({}, mediaOptions), { success: fulfill, error: reject }));
                                                })];
                                            case 1:
                                                offerJsep = _a.sent();
                                                return [4 /*yield*/, handle.sendAsyncRequest({
                                                        message: {
                                                            request: "configure",
                                                        },
                                                        jsep: offerJsep,
                                                        expectResponse: function (r) { return r.message.videoroom == "event" && r.message.configured == "ok"; }
                                                    })];
                                            case 2:
                                                response = _a.sent();
                                                return [4 /*yield*/, new Promise(function (fulfill, reject) {
                                                        handle.handleRemoteJsep({
                                                            jsep: response.jsep,
                                                            customizeSdp: mediaOptions === null || mediaOptions === void 0 ? void 0 : mediaOptions.customizeRemoteSdp,
                                                            success: fulfill,
                                                            error: reject
                                                        });
                                                    })];
                                            case 3:
                                                _a.sent();
                                                options.mediaOptions = mediaOptions;
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                            unpublish: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, cleanup.run()];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            }
                        }];
                case 5:
                    err_2 = _a.sent();
                    return [4 /*yield*/, cleanup.run().catch(console.error)];
                case 6:
                    _a.sent();
                    throw err_2;
                case 7: return [2 /*return*/];
            }
        });
    });
}
function createVideoRoomSubscriber(session, roomId, streams, opts) {
    return __awaiter(this, void 0, void 0, function () {
        var options, cleanup, callbacks, handle_2, response, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = __assign({}, opts);
                    cleanup = makeCleanup();
                    callbacks = makeCallbacks();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 7]);
                    return [4 /*yield*/, attachToPlugin(session, "janus.plugin.videoroom")
                        // remember to detach
                    ];
                case 2:
                    handle_2 = _a.sent();
                    // remember to detach
                    cleanup.add(function () {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, new Promise(function (fulfill, reject) {
                                            handle_2.detach({
                                                success: fulfill,
                                                error: reject
                                            });
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    });
                    // listen to events and invoke callbacks
                    handle_2.eventTarget.addEventListener("remotetrack", function (event) {
                        if (event.detail.added) {
                            callbacks.get("onTrackAdded")
                                .then(function (callback) { return callback(event.detail.track, event.detail.mid); })
                                .catch(console.error);
                        }
                        else {
                            callbacks.get("onTrackRemoved")
                                .then(function (callback) { return callback(event.detail.track, event.detail.mid); })
                                .catch(console.error);
                        }
                    });
                    return [4 /*yield*/, handle_2.sendAsyncRequest({
                            message: {
                                request: "join",
                                ptype: "subscriber",
                                room: roomId,
                                streams: streams
                            },
                            expectResponse: function (r) { return r.message.videoroom == "attached" && r.message.room == roomId; }
                        })];
                case 3:
                    response = _a.sent();
                    if (!response.jsep)
                        throw new Error("Missing offer Jsep");
                    return [4 /*yield*/, handleOffer(handle_2, response.jsep, options.mediaOptions)
                        // construct and return the VideoRoomSubscriber object
                    ];
                case 4:
                    _a.sent();
                    // construct and return the VideoRoomSubscriber object
                    return [2 /*return*/, {
                            pluginHandle: handle_2,
                            onTrackAdded: function (callback) {
                                callbacks.set("onTrackAdded", callback);
                            },
                            onTrackRemoved: function (callback) {
                                callbacks.set("onTrackRemoved", callback);
                            },
                            addStreams: function (streams) {
                                return __awaiter(this, void 0, void 0, function () {
                                    var response;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, handle_2.sendAsyncRequest({
                                                    message: { request: "subscribe", streams: streams },
                                                    expectResponse: function (r) { return r.message.videoroom == "updated" && r.message.room == roomId; }
                                                })];
                                            case 1:
                                                response = _a.sent();
                                                if (!response.jsep) return [3 /*break*/, 3];
                                                return [4 /*yield*/, handleOffer(handle_2, response.jsep, options.mediaOptions)];
                                            case 2:
                                                _a.sent();
                                                _a.label = 3;
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                            removeStreams: function (streams) {
                                return __awaiter(this, void 0, void 0, function () {
                                    var response;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, handle_2.sendAsyncRequest({
                                                    message: { request: "unsubscribe", streams: streams },
                                                    expectResponse: function (r) { return r.message.videoroom == "updated" && r.message.room == roomId; }
                                                })];
                                            case 1:
                                                response = _a.sent();
                                                if (!response.jsep) return [3 /*break*/, 3];
                                                return [4 /*yield*/, handleOffer(handle_2, response.jsep, options.mediaOptions)];
                                            case 2:
                                                _a.sent();
                                                _a.label = 3;
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                            pause: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, handle_2.sendAsyncRequest({
                                                    message: { request: "pause" },
                                                    expectResponse: function (r) { return r.message.videoroom == "event" && r.message.paused == "ok"; }
                                                })];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                            resume: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, handle_2.sendAsyncRequest({
                                                    message: { request: "start" },
                                                    expectResponse: function (r) { return r.message.videoroom == "event" && r.message.started == "ok"; }
                                                })];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                            configure: function (configureOptions) {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, handle_2.sendAsyncRequest({
                                                    message: __assign(__assign({}, configureOptions), { request: "configure", restart: false }),
                                                    expectResponse: function (r) { return r.message.videoroom == "event" && r.message.configured == "ok"; }
                                                })];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                            restart: function (mediaOptions) {
                                if (mediaOptions === void 0) { mediaOptions = options.mediaOptions; }
                                return __awaiter(this, void 0, void 0, function () {
                                    var response;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, handle_2.sendAsyncRequest({
                                                    message: {
                                                        request: "configure",
                                                        restart: true
                                                    },
                                                    expectResponse: function (r) { return r.message.videoroom == "event" && r.message.configured == "ok"; }
                                                })];
                                            case 1:
                                                response = _a.sent();
                                                if (!response.jsep)
                                                    throw new Error("Missing offer Jsep");
                                                return [4 /*yield*/, handleOffer(handle_2, response.jsep, mediaOptions)];
                                            case 2:
                                                _a.sent();
                                                options.mediaOptions = mediaOptions;
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                            unsubscribe: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, cleanup.run()];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            }
                        }];
                case 5:
                    err_3 = _a.sent();
                    return [4 /*yield*/, cleanup.run().catch(console.error)];
                case 6:
                    _a.sent();
                    throw err_3;
                case 7: return [2 /*return*/];
            }
        });
    });
}
function createStreamingSubscriber(session, mountPointId, options) {
    return __awaiter(this, void 0, void 0, function () {
        var cleanup, callbacks, handle_3, response, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cleanup = makeCleanup();
                    callbacks = makeCallbacks();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 7]);
                    return [4 /*yield*/, attachToPlugin(session, "janus.plugin.streaming")
                        // remember to detach
                    ];
                case 2:
                    handle_3 = _a.sent();
                    // remember to detach
                    cleanup.add(function () {
                        return __awaiter(this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, new Promise(function (fulfill, reject) {
                                            handle_3.detach({
                                                success: fulfill,
                                                error: reject
                                            });
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    });
                    // listen to events and invoke callbacks
                    handle_3.eventTarget.addEventListener("remotetrack", function (event) {
                        if (event.detail.added) {
                            callbacks.get("onTrackAdded")
                                .then(function (callback) { return callback(event.detail.track, event.detail.mid); })
                                .catch(console.error);
                        }
                        else {
                            callbacks.get("onTrackRemoved")
                                .then(function (callback) { return callback(event.detail.track, event.detail.mid); })
                                .catch(console.error);
                        }
                    });
                    return [4 /*yield*/, handle_3.sendAsyncRequest({
                            message: __assign(__assign({}, options === null || options === void 0 ? void 0 : options.watchOptions), { request: "watch", id: mountPointId }),
                            expectResponse: function (r) { var _a; return r.message.streaming == "event" && ((_a = r.message.result) === null || _a === void 0 ? void 0 : _a.status) == "preparing"; }
                        })];
                case 3:
                    response = _a.sent();
                    if (!response.jsep)
                        throw new Error("Missing offer Jsep");
                    return [4 /*yield*/, handleOffer(handle_3, response.jsep, options === null || options === void 0 ? void 0 : options.mediaOptions)
                        // construct and return the StreamingSubscriber object
                    ];
                case 4:
                    _a.sent();
                    // construct and return the StreamingSubscriber object
                    return [2 /*return*/, {
                            pluginHandle: handle_3,
                            onTrackAdded: function (callback) {
                                callbacks.set("onTrackAdded", callback);
                            },
                            onTrackRemoved: function (callback) {
                                callbacks.set("onTrackRemoved", callback);
                            },
                            pause: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, handle_3.sendAsyncRequest({
                                                    message: { request: "pause" },
                                                    expectResponse: function (r) { var _a; return r.message.streaming == "event" && ((_a = r.message.result) === null || _a === void 0 ? void 0 : _a.status) == "pausing"; }
                                                })];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                            resume: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, handle_3.sendAsyncRequest({
                                                    message: { request: "start" },
                                                    expectResponse: function (r) { var _a; return r.message.streaming == "event" && ((_a = r.message.result) === null || _a === void 0 ? void 0 : _a.status) == "starting"; }
                                                })];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                            configure: function (configureOptions) {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, handle_3.sendAsyncRequest({
                                                    message: __assign(__assign({}, configureOptions), { request: "configure" }),
                                                    expectResponse: function (r) { var _a; return r.message.streaming == "event" && ((_a = r.message.result) === null || _a === void 0 ? void 0 : _a.event) == "configured"; }
                                                })];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                            switch: function (newMountPointId) {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, handle_3.sendAsyncRequest({
                                                    message: {
                                                        request: "switch",
                                                        id: newMountPointId
                                                    },
                                                    expectResponse: function (r) { var _a; return r.message.streaming == "event" && ((_a = r.message.result) === null || _a === void 0 ? void 0 : _a.switched) == "ok"; }
                                                })];
                                            case 1:
                                                _a.sent();
                                                mountPointId = newMountPointId;
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                            restart: function (newOptions) {
                                if (newOptions === void 0) { newOptions = options; }
                                return __awaiter(this, void 0, void 0, function () {
                                    var response;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, handle_3.sendAsyncRequest({
                                                    message: __assign(__assign({}, newOptions === null || newOptions === void 0 ? void 0 : newOptions.watchOptions), { request: "watch", id: mountPointId }),
                                                    expectResponse: function (r) { var _a; return r.message.streaming == "event" && ((_a = r.message.result) === null || _a === void 0 ? void 0 : _a.status) == "preparing"; }
                                                })];
                                            case 1:
                                                response = _a.sent();
                                                if (!response.jsep)
                                                    throw new Error("Missing offer Jsep");
                                                return [4 /*yield*/, handleOffer(handle_3, response.jsep, newOptions === null || newOptions === void 0 ? void 0 : newOptions.mediaOptions)];
                                            case 2:
                                                _a.sent();
                                                options = newOptions;
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                            unsubscribe: function () {
                                return __awaiter(this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, cleanup.run()];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            }
                        }];
                case 5:
                    err_4 = _a.sent();
                    return [4 /*yield*/, cleanup.run().catch(console.error)];
                case 6:
                    _a.sent();
                    throw err_4;
                case 7: return [2 /*return*/];
            }
        });
    });
}
function handleOffer(handle, offerJsep, mediaOptions) {
    return __awaiter(this, void 0, void 0, function () {
        var answerJsep;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // allow customizing the remote (offer) sdp
                    if (mediaOptions === null || mediaOptions === void 0 ? void 0 : mediaOptions.customizeRemoteSdp) {
                        mediaOptions.customizeRemoteSdp(offerJsep);
                    }
                    return [4 /*yield*/, new Promise(function (fulfill, reject) {
                            // the answer (local) sdp can be customized via mediaOptions.customizeSdp
                            handle.createAnswer(__assign(__assign({}, mediaOptions), { jsep: offerJsep, success: fulfill, error: reject }));
                        })];
                case 1:
                    answerJsep = _a.sent();
                    return [4 /*yield*/, handle.sendAsyncRequest({
                            message: { request: "start" },
                            jsep: answerJsep,
                            expectResponse: function (r) {
                                var _a;
                                return r.message.videoroom == "event" && r.message.started == "ok" ||
                                    r.message.streaming == "event" && ((_a = r.message.result) === null || _a === void 0 ? void 0 : _a.status) == "starting";
                            }
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function makeCleanup() {
    var tasks = [];
    return {
        add: function (task) {
            tasks.push(task);
        },
        run: function () {
            var promise = Promise.resolve();
            for (var i = tasks.length - 1; i >= 0; i--)
                promise = promise.then(tasks[i]);
            return promise;
        }
    };
}
function makeCallbacks() {
    var pending = {};
    var getPending = function (name) {
        if (!pending[name]) {
            var fulfill_1 = function (_) { };
            var promise = new Promise(function (f) { return fulfill_1 = f; });
            pending[name] = { promise: promise, fulfill: fulfill_1 };
        }
        return pending[name];
    };
    return {
        get: function (name) {
            return getPending(name).promise;
        },
        set: function (name, value) {
            getPending(name).fulfill(value);
        }
    };
}
function makeEventTarget() {
    var listeners = {};
    return {
        addEventListener: function (name, callback) {
            if (!listeners[name])
                listeners[name] = [];
            listeners[name].push(callback);
        },
        removeEventListener: function (name, callback) {
            if (!listeners[name])
                return;
            var index = listeners[name].indexOf(callback);
            if (index >= 0)
                listeners[name].splice(index, 1);
        },
        dispatchEvent: function (event) {
            if (!listeners[event.type])
                return;
            for (var i = 0; i < listeners[event.type].length; i++) {
                listeners[event.type][i](event);
            }
        }
    };
}
