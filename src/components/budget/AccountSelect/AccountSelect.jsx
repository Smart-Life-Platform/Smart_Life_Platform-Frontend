import { UilCalendarAlt } from '@iconscout/react-unicons';
import Dropdown from '../ui/Dropdown';

export default function AccountSelect({ accounts, value, onChange }) {
  return (
    <Dropdown
      variant="pill"
      align="right"
      ariaLabel="Account"
      icon={<UilCalendarAlt size="14" />}
      value={value}
      options={accounts.map((a) => ({ value: a.id, label: a.name }))}
      onChange={onChange}
      className="account-select"
    />
  );
}
