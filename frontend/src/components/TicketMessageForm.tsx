import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'

export type NewMessageData = {
    ticketId: number
    body: string
}

interface TicketMessageFormProps {
    ticketId: number
    onSubmit: (data: NewMessageData) => Promise<void>
}

export default function TicketMessageForm({ ticketId, onSubmit }: TicketMessageFormProps) {
    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<NewMessageData>({
        defaultValues: {
            ticketId,
            body: '',
        },
    })

    const submitMessage: SubmitHandler<NewMessageData> = async (data) => {
        try {
            await onSubmit({
                ticketId,
                body: data.body.trim(),
            })

            reset({
                ticketId,
                body: '',
            })
        } catch (error) {
            setError('root', {
                message: error instanceof Error ? error.message : 'Something went wrong.',
            })
        }
    }

    return (
        <form className="ticket-message-form" onSubmit={handleSubmit(submitMessage)}>
            <textarea
                className="ticket-message-textarea"
                placeholder="Write a message..."
                rows={4}
                {...register('body', {
                    required: 'Message body is required',
                    validate: (value) => value.trim().length > 0 || 'Message body is required',
                })}
            />

            {errors.body && <span className="error">{errors.body.message}</span>}
            {errors.root && <span className="error">{errors.root.message}</span>}

            <button className="ticket-message-send" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send'}
            </button>
        </form>
    )
}