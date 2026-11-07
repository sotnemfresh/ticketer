import { useState, type ReactNode } from "react"
import { FieldLabel } from "@/components/ui/field"
import {
    Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList,
} from "@/components/ui/combobox"

interface SidebarComboboxProps<T> {
    id: string
    label: string
    items: T[]
    value: T | null
    onValueChange: (value: T | null) => void
    getLabel: (item: T) => string
    getKey: (item: T) => string
    placeholder: string
    emptyMessage: string
    filter?: (item: T, query: string) => boolean
    renderItem?: (item: T) => ReactNode
    description?: ReactNode
    footer?: ReactNode
    showClear?: boolean
}

export function SidebarCombobox<T>({
    id, label, items, value, onValueChange, getLabel, getKey,
    placeholder, emptyMessage, filter, renderItem, description, footer, showClear,
}: SidebarComboboxProps<T>) {
    const [search, setSearch] = useState<string | null>(null)

    return (
        <>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Combobox<T>
                items={items}
                value={value}
                inputValue={search ?? (value === null ? "" : getLabel(value))}
                onInputValueChange={(input, details) => {
                    if (details.reason === "input-change") setSearch(input)
                }}
                onOpenChange={(open, details) => {
                    if (!open) setSearch(null)
                    else if (details.reason !== "input-change") setSearch("")
                }}
                onValueChange={onValueChange}
                itemToStringLabel={getLabel}
                itemToStringValue={getKey}
                isItemEqualToValue={(item, selected) => getKey(item) === getKey(selected)}
                filter={filter}
            >
                <ComboboxInput id={id} className="w-full" placeholder={placeholder} showClear={showClear} />
                <ComboboxContent>
                    <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
                    <ComboboxList>
                        {(item: T) => (
                            <ComboboxItem key={getKey(item)} value={item}>
                                {renderItem ? renderItem(item) : getLabel(item)}
                            </ComboboxItem>
                        )}
                    </ComboboxList>
                    {footer && <div className="border-t p-1">{footer}</div>}
                </ComboboxContent>
            </Combobox>
            {description && <p className="break-all text-xs text-muted-foreground">{description}</p>}
        </>
    )
}