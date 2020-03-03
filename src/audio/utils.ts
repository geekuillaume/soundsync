export type AudioInstance<T> = T & {
  instanceUuid: string;
}

export type MaybeAudioInstance<T> = T & {
  instanceUuid?: string;
}
