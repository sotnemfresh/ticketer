import createDOMPurify from "dompurify"
import type { TicketMessage } from "@/types/ticketMessage"

const purifier = createDOMPurify(window)

purifier.addHook("uponSanitizeAttribute", (node, data) => {
    if (node.nodeName === "IMG" && data.attrName === "src") {
        data.keepAttr = /^\/api\/attachments\/\d+$/.test(data.attrValue)
    }
})
purifier.addHook("afterSanitizeAttributes", (node) => {
    if (!(node instanceof HTMLElement)) return

    node.style.removeProperty("color")
    node.style.removeProperty("background-color")
})

export function TicketMessageBody({
    bodyHtml, bodyText,
}: Pick<TicketMessage, "bodyHtml" | "bodyText">) {
    const html = bodyHtml?.trim()
        ? purifier.sanitize(bodyHtml, {
            ADD_ATTR: ["target"],
            FORBID_TAGS: ["style", "form", "input", "button"],
            ALLOW_DATA_ATTR: false,
        })
        : ""

    return html ? (
        <div
            className="min-w-0 overflow-x-auto break-words text-sm leading-6 [&_img]:h-auto [&_img]:max-w-full [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_pre]:whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    ) : (
        <p className="whitespace-pre-wrap break-words text-sm leading-6">{bodyText}</p>
    )
}