import { useEffect } from "react"
import { useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

export function useTicketEditor(disabled: boolean) {
    const editor = useEditor({
        extensions: [StarterKit.configure({ link: { openOnClick: false } })],
        content: "",
        editorProps: {
            attributes: {
                role: "textbox",
                "aria-label": "Message body",
                "aria-multiline": "true",
                class: "min-h-32 p-3 outline-none text-sm leading-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
            },
        },
    })
    useEffect(() => { editor?.setEditable(!disabled) }, [editor, disabled])
    return editor
}