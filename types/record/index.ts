
export const enum RecordStatus {
    PENDING,
    COMPLETED,
    DECLINED
}

export type ExtraRecordProps = {
    timestamp: string,
    additionalNote: string
}