import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMoney } from '../budgetUtils';

export default function ExpensesChart({ items }) {
  if (!items.length) return null;
  const data = items.map(({ category, total }) => ({ name: category.name, value: total, color: category.color }));
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={65} outerRadius={105} paddingAngle={2}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatMoney(v)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
