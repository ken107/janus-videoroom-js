
declare global {
  const Janus: {
    new(options: unknown): JanusSession
    init(options: unknown): void
  }
}

export interface JanusSession {
  isConnected(): boolean
  destroy(options: unknown): void
  attach(options: unknown): void
}

interface JanusPluginHandle {
  createOffer(options: unknown): void
  createAnswer(options: unknown): void
  handleRemoteJsep(options: unknown): void
  send(options: unknown): void
  detach(options: unknown): void
}

type JanusMessage = {[key: string]: any}

interface Jsep {
    sdp: string
}

interface JanusStreamSpec {
    feed: unknown
    mid?: JanusMid
}

type JanusMid = unknown

interface JanusSessionOptions {
    iceServers?: string[]
    ipv6?: boolean
    withCredentials?: boolean
    max_poll_events?: number
    destroyOnUnload?: boolean
    token?: unknown
    apisecret?: string
}

interface JanusPublishOptions {
    audiocodec?: string
    videocodec?: string
    bitrate?: number
    record?: boolean
    filename?: string
    display?: string
    audio_level_average?: number
    audio_active_packets?: number
    descriptions?: {mid: JanusMid, description: string}[]
}

interface JanusWatchOptions {
    pin?: string
    media?: string[]
}

interface JanusMediaOptions {
    tracks?: JanusTrackSpec[]
    trickle?: boolean
    stream?: MediaStream
    customizeSdp?: (jsep: Jsep) => void
    customizeRemoteSdp?: (jsep: Jsep) => void
}

interface JanusTrackSpec {
    type: string
    mid?: JanusMid
    capture?: boolean|string|{deviceId: unknown, width?: number, height?: number}|MediaStreamTrack
    simulcast?: boolean
    svc?: unknown
    recv?: boolean
    add?: boolean
    replace?: boolean
    remove?: boolean
    dontStop?: boolean
    transforms?: unknown
}

interface JanusSubscriberConfigureOptions {
    mid?: JanusMid
    send?: boolean
    substream?: number
    temporal?: number
    fallback?: number
    spatial_layer?: number
    temporal_layer?: number
    audio_level_average?: number
    audio_active_packets?: number
}
