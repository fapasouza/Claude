import { STATUS_ROTULO, type Status } from '../api'

export default function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{STATUS_ROTULO[status]}</span>
}
