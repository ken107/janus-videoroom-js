import { JanusMediaOptions, JanusMessage, JanusMid, JanusPluginHandle, JanusPublishOptions, JanusSessionOptions, JanusStreamSpec, JanusSubscriberConfigureOptions, JanusWatchOptions, Jsep } from "./janus";
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
