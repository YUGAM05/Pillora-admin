// URL checks for admin-entered links/media that are rendered as href/src on pillora.in.
// Blocks javascript:, data:, vbscript: and other non-web schemes (audit ADM-37).

/** Absolute http(s) URL. */
export function isSafeLinkUrl(value: unknown): value is string {
    if (typeof value !== "string" || !value.trim()) return false;
    try {
        const u = new URL(value.trim());
        return u.protocol === "https:" || u.protocol === "http:";
    } catch {
        return false;
    }
}

/** Empty, a site-relative path ("/uploads/x.png") or an absolute http(s) URL. */
export function isSafeMediaUrl(value: unknown): boolean {
    if (value === undefined || value === null || value === "") return true;
    if (typeof value !== "string") return false;
    const v = value.trim();
    if (v.startsWith("/") && !v.startsWith("//")) return true;
    return isSafeLinkUrl(v);
}
