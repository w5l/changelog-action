export interface Configuration {
    /** Main title of the changelog. */
    title: string | null,
    /** Explicit section definitions. */
    sections: { title: string, prefixes: string[] }[],
    /** If not null, put any items that do not match an explicit section under this title. */
    otherSectionTitle: string | null
}
