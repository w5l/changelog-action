/** Model for the GraphQL query to get Issues/Pulls. */
export interface Issue {
    number: number,
    title: string,
    url?: string,
    closedAt?: string,
    mergedAt?: string
};

/* Model for the release event that triggers the workflow. */
export interface ReleasePayload {
    action: string,
    release: {
        body: string | null,
        /* Date of the commit */
        created_at: string,
        draft: boolean,
        id: number,
        name: string,
        prerelease: boolean,
        /* Date of the release */
        published_at: string,
        tag_name: string
    }
}

export interface Changelog {
    title: string | null,
    sections: ChangelogSection[],
}

export interface ChangelogSection {
    title: string,
    items: { title: string, item: Issue }[]
}
