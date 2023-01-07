interface VideoRoomClient {
    createSession(server: string | string[], options?: JanusSessionOptions): Promise<VideoRoomSession>;
}
interface VideoRoomSession {
    eventTarget: ReturnType<typeof makeEventTarget>;
    isValid(): boolean;
    joinRoom(roomId: string | number): Promise<VideoRoom>;
    subscribe(roomId: string | number, streams: JanusStreamSpec[], options?: {
        mediaOptions?: JanusMediaOptions;
    }): Promise<VideoRoomSubscriber>;
    watch(mountPointId: number, options?: {
        watchOptions?: JanusWatchOptions;
        mediaOptions?: JanusMediaOptions;
    }): Promise<StreamingSubscriber>;
    attachToPlugin(plugin: string): Promise<JanusPluginHandleEx>;
    destroy(): Promise<void>;
}
interface VideoRoom {
    roomId: string | number;
    pluginHandle: JanusPluginHandleEx;
    onPublisherAdded(callback: (publishers: unknown[]) => void): void;
    onPublisherRemoved(callback: (publisherId: unknown) => void): void;
    publish(options?: {
        publishOptions?: JanusPublishOptions;
        mediaOptions?: JanusMediaOptions;
    }): Promise<VideoRoomPublisher>;
    subscribe(streams: JanusStreamSpec[], options?: {
        mediaOptions?: JanusMediaOptions;
    }): Promise<VideoRoomSubscriber>;
    leave(): Promise<void>;
}
interface VideoRoomPublisher {
    publisherId: string | number;
    onTrackAdded(callback: (track: MediaStreamTrack) => void): void;
    onTrackRemoved(callback: (track: MediaStreamTrack) => void): void;
    configure(configureOptions: JanusPublishOptions): Promise<void>;
    restart(mediaOptions: JanusMediaOptions): Promise<void>;
    unpublish(): Promise<void>;
}
interface VideoRoomSubscriber {
    onTrackAdded(callback: (track: MediaStreamTrack, mid: JanusMid) => void): void;
    onTrackRemoved(callback: (track: MediaStreamTrack, mid: JanusMid) => void): void;
    addStreams(streams: JanusStreamSpec[]): Promise<void>;
    removeStreams(streams: JanusStreamSpec[]): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    configure(configureOptions: JanusSubscriberConfigureOptions): Promise<void>;
    restart(mediaOptions: JanusMediaOptions): Promise<void>;
    unsubscribe(): Promise<void>;
}
interface StreamingSubscriber {
    onTrackAdded(callback: (track: MediaStreamTrack, mid: JanusMid) => void): void;
    onTrackRemoved(callback: (track: MediaStreamTrack, mid: JanusMid) => void): void;
    pause(): Promise<void>;
    resume(): Promise<void>;
    configure(configureOptions: JanusSubscriberConfigureOptions): Promise<void>;
    switch(mountPointId: number): Promise<void>;
    restart(options?: {
        watchOptions?: JanusWatchOptions;
        mediaOptions?: JanusMediaOptions;
    }): Promise<void>;
    unsubscribe(): Promise<void>;
}
interface JanusPluginHandleEx {
    createOffer(options: unknown): void;
    createAnswer(options: unknown): void;
    handleRemoteJsep(options: unknown): void;
    send(options: unknown): void;
    detach(options: unknown): void;
    eventTarget: ReturnType<typeof makeEventTarget>;
    sendRequest(message: JanusMessage): Promise<JanusMessage>;
    sendAsyncRequest(options: {
        message: JanusMessage;
        jsep?: Jsep;
        expectResponse: (response: AsyncResponse) => boolean;
    }): Promise<AsyncResponse>;
}
interface AsyncResponse {
    message: JanusMessage;
    jsep?: Jsep;
}
type JanusMessage = {
    [key: string]: any;
};
interface Jsep {
    sdp: string;
}
interface JanusStreamSpec {
    feed: unknown;
    mid?: JanusMid;
}
type JanusMid = unknown;
interface JanusSessionOptions {
    iceServers?: string[];
    ipv6?: boolean;
    withCredentials?: boolean;
    max_poll_events?: number;
    destroyOnUnload?: boolean;
    token?: unknown;
    apisecret?: string;
}
interface JanusPublishOptions {
    audiocodec?: string;
    videocodec?: string;
    bitrate?: number;
    record?: boolean;
    filename?: string;
    display?: string;
    audio_level_average?: number;
    audio_active_packets?: number;
    descriptions?: {
        mid: JanusMid;
        description: string;
    }[];
}
interface JanusWatchOptions {
    pin?: string;
    media?: string[];
}
interface JanusMediaOptions {
    tracks?: JanusTrackSpec[];
    trickle?: boolean;
    stream?: MediaStream;
    customizeSdp?: (jsep: Jsep) => void;
    customizeRemoteSdp?: (jsep: Jsep) => void;
}
interface JanusTrackSpec {
    type: string;
    mid?: JanusMid;
    capture?: boolean | string | {
        deviceId: unknown;
        width?: number;
        height?: number;
    };
    simulcast?: boolean;
    svc?: unknown;
    recv?: boolean;
    add?: boolean;
    replace?: boolean;
    remove?: boolean;
    dontStop?: boolean;
    transforms?: unknown;
}
interface JanusSubscriberConfigureOptions {
    mid?: JanusMid;
    send?: boolean;
    substream?: number;
    temporal?: number;
    fallback?: number;
    spatial_layer?: number;
    temporal_layer?: number;
    audio_level_average?: number;
    audio_active_packets?: number;
}
export declare function createVideoRoomClient(options?: {
    debug?: boolean | string[];
    dependencies?: unknown;
}): Promise<VideoRoomClient>;
declare function makeEventTarget(): {
    addEventListener(name: string, callback: (event: CustomEvent) => void): void;
    removeEventListener(name: string, callback: (event: CustomEvent) => void): void;
    dispatchEvent(event: Event): void;
};
export {};
