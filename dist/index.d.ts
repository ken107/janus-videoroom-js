import Janus, { JanusJS } from "janus-gateway";
export { Janus };
type JanusMid = unknown;
interface JanusMessage {
    [key: string]: any;
}
interface JanusMediaOptions {
    tracks?: JanusJS.TrackOption[];
    trickle?: boolean;
    stream?: MediaStream;
    customizeSdp?: (jsep: JanusJS.JSEP) => void;
    customizeRemoteSdp?: (jsep: JanusJS.JSEP) => void;
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
interface JanusPublisherConfigureOptions extends JanusPublishOptions {
    keyframe?: boolean;
    streams?: Array<{
        mid: JanusMid;
        keyframe?: boolean;
        send?: boolean;
        min_delay?: number;
        max_delay?: number;
    }>;
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
    createSession(server: string | string[], options?: Partial<JanusJS.ConstructorOptions>): Promise<VideoRoomSession>;
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
    configure(configureOptions: JanusPublisherConfigureOptions): Promise<void>;
    restart(mediaOptions?: JanusMediaOptions, publishOptions?: JanusPublishOptions): Promise<void>;
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
export interface JanusPluginHandleEx extends JanusJS.PluginHandle {
    eventTarget: ReturnType<typeof makeEventTarget>;
    sendRequest(message: JanusMessage & {
        request: string;
    }): Promise<JanusMessage>;
    sendAsyncRequest(options: {
        message: JanusMessage & {
            request: string;
        };
        jsep?: JanusJS.JSEP;
        expectResponse: (response: AsyncResponse) => boolean;
    }): Promise<AsyncResponse>;
    handleRemoteJsep(params: JanusJS.PluginHandleRemoteJsepParam & {
        customizeSdp?: (jsep: JanusJS.JSEP) => void;
    }): void;
}
interface AsyncResponse {
    message: JanusMessage;
    jsep?: JanusJS.JSEP;
}
export declare function createVideoRoomClient(options?: JanusJS.InitOptions): Promise<VideoRoomClient>;
declare function makeEventTarget(): {
    addEventListener(name: string, callback: (event: CustomEvent) => void): void;
    removeEventListener(name: string, callback: (event: CustomEvent) => void): void;
    dispatchEvent(event: Event): void;
};
