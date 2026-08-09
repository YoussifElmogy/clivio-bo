import Tooltip from '@mui/material/Tooltip';
import dayjs from 'dayjs';
import { PickerDay } from '@mui/x-date-pickers/PickerDay';

export const SCHEDULE_PAST_DATE_TOOLTIP = "Can't book appointments for past dates.";

export default function ScheduleDatePickerDay({ minBookableDate, ...props }) {
  const { day, outsideCurrentMonth, disabled, ...pickerProps } = props;
  const d = dayjs(day).startOf('day');
  const min = dayjs(minBookableDate).startOf('day');
  const isPast = d.isBefore(min, 'day');

  const dayEl = (
    <PickerDay
      day={day}
      outsideCurrentMonth={outsideCurrentMonth}
      disabled={disabled}
      {...pickerProps}
    />
  );

  if (outsideCurrentMonth || !isPast) {
    return dayEl;
  }

  return (
    <Tooltip title={SCHEDULE_PAST_DATE_TOOLTIP} arrow describeChild enterDelay={200}>
      <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>{dayEl}</span>
    </Tooltip>
  );
}
