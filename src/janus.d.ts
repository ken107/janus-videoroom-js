
export interface JanusSession {
  new(options: unknown): JanusSession
  init(options: unknown): void
  isConnected(): boolean
  destroy(options: unknown): void
  attach(options: unknown): void
}

declare global {
  const Janus: JanusSession
}
