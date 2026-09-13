import './TicketForm.css'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'

export type NewTicketData = {
    subject: string
    description: string
    status: 'open' | 'new' | 'pending' | 'closed' | 'solved'
    priority: 'low' | 'medium' | 'high' | 'urgent'
}

interface TicketFormProps {
    onSubmit: (data: NewTicketData) => Promise<void>
    onCancel: () => void
}

export default function TicketForm({ onSubmit, onCancel }: TicketFormProps) {

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting }
    } = useForm<NewTicketData>();

    const handleFormSubmit: SubmitHandler<NewTicketData> = async (data) => {
        try {
            await onSubmit(data)
            onCancel()
        } catch (error) {
            setError('root', {
                message: error instanceof Error ? error.message : 'Something went wrong.',
            })
        }
    }

    return (
        <form
            className="ticket-form"
            onSubmit={handleSubmit(handleFormSubmit)}
        >
            <h2>Create New Ticket</h2>

            <input
                type="text"
                placeholder="Subject"
                {...register('subject', {
                    required: 'Subject is required',
                })}
            />

            {errors.subject && (
                <span className="error">{errors.subject.message}</span>
            )}

            <input
                type="text"
                placeholder="Description"
                {...register('description', {
                    required: 'Description is required',
                })}
            />

            {errors.description && (
                <span className="error">{errors.description.message}</span>
            )}

            <div className="ticket-meta">
                <div className="field">

                    <select
                        {...register('status', {
                            required: 'Status is required',
                        })}>
                        <option value="open">Open</option>
                        <option value="new">New</option>
                        <option value="pending">Pending</option>

                    </select>

                    {errors.status && (
                        <span className="error">{errors.status.message}</span>
                    )}
                </div>

                <div className="field">
                    <select
                        {...register('priority', {
                            required: 'Priority is required',
                        })}
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>

                    {errors.priority && (
                        <span className="error">{errors.priority.message}</span>
                    )}
                </div>
            </div>

            <button disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </button>

            <button type="button" onClick={onCancel}>
                Cancel
            </button>

            {errors.root && (
                <span className="error">{errors.root.message}</span>
            )}
        </form>
    )
}