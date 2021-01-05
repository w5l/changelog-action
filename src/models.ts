export interface Issue {
    number: number,
    title: string,
    url?: string,
    closedAt?: string,
    mergedAt?: string
};

export interface ReleasePayload {
    action: string,
    release: {
        body: string | null,
        created_at: string,
        draft: boolean,
        id: number,
        name: string,
        prerelease: boolean,
        published_at: string,
        tag_name: string
    }
}
