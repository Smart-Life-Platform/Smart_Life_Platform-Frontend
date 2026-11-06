import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatMoney } from '../budgetUtils';

export default function ExpensesChart({ items, total, caption }) {
  const data = items.map(({ category, total: value }) => ({ name: category.name, value, color: category.color, id: category.id }));
  return (
    <div className="donut">
      <div className="donut__ring">
        {data.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="78%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                stroke="#fff"
                strokeWidth={3}
                isAnimationActive={false}
              >
                {data.map((d) => (
                  <Cell key={d.id} fill={d.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, name) => [formatMoney(v), name]} />
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="donut__center">
          <span>Total expenses</span>
          <strong>{formatMoney(total)}</strong>
        </div>
      </div>
      <div className="donut__caption">{caption}</div>
      <div className="donut__footer">
        <span>{items.length} categories</span>
        <strong>{items.length ? '100%' : '0%'}</strong>
      </div>
    </div>
  );
}
