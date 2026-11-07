import { type Editor, useEditorState } from "@tiptap/react"
import { Bold, Italic, Underline, List, ListOrdered, Undo2, Redo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"

interface TicketEditorToolbarProps {
    editor: Editor | null
    disabled?: boolean
}

export function TicketEditorToolbar({
    editor,
    disabled = false,
}: TicketEditorToolbarProps) {
    const state = useEditorState({
        editor,
        selector: ({ editor }) => editor ? {
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            underline: editor.isActive("underline"),
            bulletList: editor.isActive("bulletList"),
            orderedList: editor.isActive("orderedList"),
            canUndo: editor.can().undo(),
            canRedo: editor.can().redo(),
        } : null,
    })

    if (!editor || !state) return null

    const tools = [
        { label: "Bold", icon: Bold, active: state.bold, available: true,
            run: () => editor.chain().focus().toggleBold().run() },
        { label: "Italic", icon: Italic, active: state.italic, available: true,
            run: () => editor.chain().focus().toggleItalic().run() },
        { label: "Underline", icon: Underline, active: state.underline, available: true,
            run: () => editor.chain().focus().toggleUnderline().run() },
        { label: "Bullet list", icon: List, active: state.bulletList, available: true,
            run: () => editor.chain().focus().toggleBulletList().run() },
        { label: "Numbered list", icon: ListOrdered, active: state.orderedList, available: true,
            run: () => editor.chain().focus().toggleOrderedList().run() },
        { label: "Undo", icon: Undo2, active: undefined, available: state.canUndo,
            run: () => editor.chain().focus().undo().run() },
        { label: "Redo", icon: Redo2, active: undefined, available: state.canRedo,
            run: () => editor.chain().focus().redo().run() },
    ]

    return (
        <TooltipProvider delay={300}>
            <div role="group" aria-label="Message formatting" className="flex flex-wrap gap-1 border-b p-2">
                {tools.map(({ label, icon: Icon, active, available, run }) => (
                    <Tooltip key={label}>
                        <TooltipTrigger render={
                            <Button type="button" size="icon"
                                variant={active ? "secondary" : "ghost"}
                                aria-label={label} aria-pressed={active}
                                disabled={disabled || !available}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={run}>
                                <Icon />
                            </Button>
                        } />
                        <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    )
}