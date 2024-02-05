import Janus from "janus-gateway";
export { Janus };
type JanusSessionOptions = ConstructorParameters<typeof Janus>[0];
type JanusPluginOptions = Parameters<Janus["attach"]>[0];
type JanusPluginHandle = Parameters<NonNullable<JanusPluginOptions["success"]>>[0];
type JanusMid = unknown;
type JanusOfferParams = Parameters<JanusPluginHandle["createOffer"]>[0];
type JanusTrackOption = NonNullable<JanusOfferParams["tracks"]>[number];
type Jsep = Parameters<NonNullable<JanusOfferParams["success"]>>[0];
interface JanusMessage {
    [key: string]: any;
}
interface JanusMediaOptions {
    tracks?: JanusTrackOption[];
    trickle?: boolean;
    stream?: MediaStream;
    customizeSdp?: (jsep: Jsep) => void;
    customizeRemoteSdp?: (jsep: Jsep) => void;
}
interface JanusStreamSpec {
    feed: unknown;
    mid?: JanusMid;
}
interface JanusWatchOptions {
    pin?: string;
    media?: string[];
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
export interface VideoRoomClient {
    createSession(server: string | string[], options?: JanusSessionOptions): Promise<VideoRoomSession>;
}
export interface VideoRoomSession {
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
export interface VideoRoom {
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
export interface VideoRoomPublisher {
    publisherId: string | number;
    onTrackAdded(callback: (track: MediaStreamTrack) => void): void;
    onTrackRemoved(callback: (track: MediaStreamTrack) => void): void;
    configure(configureOptions: JanusPublishOptions): Promise<void>;
    restart(mediaOptions?: JanusMediaOptions): Promise<void>;
    unpublish(): Promise<void>;
}
export interface VideoRoomSubscriber {
    pluginHandle: JanusPluginHandleEx;
    onTrackAdded(callback: (track: MediaStreamTrack, mid: JanusMid) => void): void;
    onTrackRemoved(callback: (track: MediaStreamTrack, mid: JanusMid) => void): void;
    addStreams(streams: JanusStreamSpec[]): Promise<void>;
    removeStreams(streams: JanusStreamSpec[]): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    configure(configureOptions: JanusSubscriberConfigureOptions): Promise<void>;
    restart(mediaOptions?: JanusMediaOptions): Promise<void>;
    unsubscribe(): Promise<void>;
}
export interface StreamingSubscriber {
    pluginHandle: JanusPluginHandleEx;
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
export interface JanusPluginHandleEx extends JanusPluginHandle {
    eventTarget: ReturnType<typeof makeEventTarget>;
    sendRequest(message: JanusMessage & {
        request: string;
    }): Promise<JanusMessage>;
    sendAsyncRequest(options: {
        message: JanusMessage & {
            request: string;
        };
        jsep?: Jsep;
        expectResponse: (response: AsyncResponse) => boolean;
    }): Promise<AsyncResponse>;
    handleRemoteJsep(params: Parameters<JanusPluginHandle["handleRemoteJsep"]>[0] & {
        customizeSdp?: (jsep: Jsep) => void;
    }): void;
}
interface AsyncResponse {
    message: JanusMessage;
    jsep?: Jsep;
}
export declare function createVideoRoomClient(options?: Parameters<typeof Janus.init>[0]): Promise<VideoRoomClient>;
declare function makeEventTarget(): {
    addEventListener(name: string, callback: (event: CustomEvent) => void): void;
    removeEventListener(name: string, callback: (event: CustomEvent) => void): void;
    dispatchEvent(event: Event): void;
};
