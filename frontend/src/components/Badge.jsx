export default function Badge({ status }) {
  const map = {
    paid: ['green', 'Paid'],
    partial: ['amber', 'Partial'],
    unpaid: ['red', 'Unpaid'],
    credit: ['red', 'Unpaid'],
  };
  const [cls, label] = map[status] || ['blue', status];
  return <span className={`badge badge-${cls}`}>{label}</span>;
}
