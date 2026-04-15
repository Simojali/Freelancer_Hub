import { useServices } from '@/hooks/useServices'

interface Props {
  slug: string
}

export default function ServiceBadge({ slug }: Props) {
  const { services } = useServices()
  const service = services.find(s => s.slug === slug)
  const color = service?.color ?? '#6366f1'
  return (
    <span
      style={{ backgroundColor: color + '20', color, border: `1px solid ${color}40` }}
      className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
    >
      {service?.name ?? slug}
    </span>
  )
}
