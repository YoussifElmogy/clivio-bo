import React, { useCallback, useEffect } from 'react';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import Add from '@mui/icons-material/Add';
import DeleteOutlineOutlined from '@mui/icons-material/DeleteOutlineOutlined';
import FormTextField from '../../components/FormTextField/FormTextField';
import { VACATION_DAY_OPTIONS } from '../../schemas/branchSchema';
import { initialBranchSchedule } from '../../schemas/doctorSchema';
import { formatTimeRangeAmPm } from '../../utils/timeFormat';

const VACATION_SHORT = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function sliceTime(t) {
  if (t == null) return '';
  const s = String(t).trim();
  return s.length >= 5 ? s.slice(0, 5) : s;
}

/** Branch working window for native time input min/max (HH:mm). */
function getBranchWorkBounds(branch) {
  if (!branch) return { min: undefined, max: undefined };
  const min = sliceTime(branch.from_time);
  const max = sliceTime(branch.to_time);
  if (!min || !max) return { min: undefined, max: undefined };
  return { min, max };
}

function formatBranchHoursHint(branch) {
  if (!branch) return null;
  const { min, max } = getBranchWorkBounds(branch);
  if (!min && !max) return null;
  return `Branch hours: ${formatTimeRangeAmPm(min, max)}`;
}

function vacationChips(branch) {
  const raw = branch?.vacation_days;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return [...new Set(raw.map(Number).filter(n => n >= 0 && n <= 6))]
    .sort((a, b) => a - b)
    .map(v => VACATION_SHORT[v] ?? v);
}

/** Weekdays the branch is open (excludes vacation_days). */
function openDaysForBranch(branch) {
  if (!branch) return VACATION_DAY_OPTIONS;
  const vac = new Set((branch.vacation_days ?? []).map(Number));
  return VACATION_DAY_OPTIONS.filter(opt => !vac.has(opt.value));
}

function defaultSlotForBranch(branch) {
  const { min, max } = getBranchWorkBounds(branch);
  if (min && max) return { from_time: min, to_time: max };
  return { from_time: '09:00', to_time: '17:00' };
}

function firstUnusedDay(branchMeta, watchedDays, excludeIndex) {
  const open = openDaysForBranch(branchMeta);
  const used = new Set(
    (watchedDays ?? [])
      .map((d, i) => (i === excludeIndex ? null : d?.day))
      .filter(v => v !== '' && v != null)
      .map(Number)
      .filter(n => !Number.isNaN(n))
  );
  const found = open.find(o => !used.has(o.value));
  return found ? found.value : open[0]?.value ?? 2;
}

function SlotRow({
  branchIndex,
  dayIndex,
  slotIndex,
  disabled,
  onRemove,
  canRemove,
  workMin,
  workMax,
  rangeHint,
}) {
  const { control } = useFormContext();
  const base = `branch_schedules.${branchIndex}.days.${dayIndex}.slots.${slotIndex}`;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.75,
        borderRadius: 2,
        bgcolor: 'background.paper',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <AccessTimeOutlined sx={{ fontSize: 20, color: 'primary.main', opacity: 0.9 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Time slot {slotIndex + 1}
        </Typography>
      </Stack>
      {rangeHint ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>
          {rangeHint}
        </Typography>
      ) : null}
      <Grid container spacing={1.5} alignItems="flex-start">
        <Grid size={{ xs: 12, sm: 5 }}>
          <Controller
            name={`${base}.from_time`}
            control={control}
            render={({ field, fieldState }) => (
              <FormTextField
                field={field}
                id={`slot-${branchIndex}-${dayIndex}-${slotIndex}-from`}
                type="time"
                label="From"
                required
                disabled={disabled}
                invalid={Boolean(fieldState.error)}
                errorMessage={fieldState.error?.message}
                timeMin={workMin}
                timeMax={workMax}
                timeStep={300}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <Controller
            name={`${base}.to_time`}
            control={control}
            render={({ field, fieldState }) => (
              <FormTextField
                field={field}
                id={`slot-${branchIndex}-${dayIndex}-${slotIndex}-to`}
                type="time"
                label="To"
                required
                disabled={disabled}
                invalid={Boolean(fieldState.error)}
                errorMessage={fieldState.error?.message}
                timeMin={workMin}
                timeMax={workMax}
                timeStep={300}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }} sx={{ display: 'flex', alignItems: 'flex-end', pb: 0.5 }}>
          <IconButton
            size="small"
            onClick={onRemove}
            disabled={disabled || !canRemove}
            aria-label="Remove time slot"
            color="error"
          >
            <DeleteOutlineOutlined fontSize="small" />
          </IconButton>
        </Grid>
      </Grid>
    </Paper>
  );
}

function DayBlock({
  branchIndex,
  dayIndex,
  disabled,
  onRemoveDay,
  dayOptions,
  branchMeta,
  workMin,
  workMax,
  rangeHint,
}) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `branch_schedules.${branchIndex}.days.${dayIndex}.slots`,
  });

  const opts = dayOptions?.length ? dayOptions : VACATION_DAY_OPTIONS;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
        <Controller
          name={`branch_schedules.${branchIndex}.days.${dayIndex}.day`}
          control={control}
          render={({ field, fieldState }) => (
            <FormControl size="small" sx={{ minWidth: 240, flex: 1 }} required error={Boolean(fieldState.error)}>
              <InputLabel id={`day-label-${branchIndex}-${dayIndex}`}>Weekday</InputLabel>
              <Select
                {...field}
                labelId={`day-label-${branchIndex}-${dayIndex}`}
                label="Weekday"
                value={field.value === '' || field.value === undefined ? '' : Number(field.value)}
                onChange={e => field.onChange(Number(e.target.value))}
                disabled={disabled}
              >
                {opts.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
              {fieldState.error?.message ? <FormHelperText>{fieldState.error.message}</FormHelperText> : null}
            </FormControl>
          )}
        />
        <IconButton size="small" color="error" aria-label="Remove day" onClick={onRemoveDay} disabled={disabled}>
          <DeleteOutlineOutlined fontSize="small" />
        </IconButton>
      </Stack>

      <Stack spacing={1.5}>
        {fields.map((slotField, slotIndex) => (
          <SlotRow
            key={slotField.id}
            branchIndex={branchIndex}
            dayIndex={dayIndex}
            slotIndex={slotIndex}
            disabled={disabled}
            canRemove={fields.length > 1}
            onRemove={() => remove(slotIndex)}
            workMin={workMin}
            workMax={workMax}
            rangeHint={rangeHint}
          />
        ))}
        <Button
          size="small"
          startIcon={<Add />}
          variant="outlined"
          onClick={() => append(defaultSlotForBranch(branchMeta))}
          disabled={disabled}
          sx={{ alignSelf: 'flex-start', borderRadius: 2 }}
        >
          Add another time range (same day)
        </Button>
      </Stack>
    </Box>
  );
}

function BranchScheduleCard({ branchIndex, branches, disabled, takenBranchIds }) {
  const { control, getValues, setValue } = useFormContext();
  const { fields: dayFields, append: appendDay, remove: removeDay } = useFieldArray({
    control,
    name: `branch_schedules.${branchIndex}.days`,
  });

  const branchId = useWatch({
    control,
    name: `branch_schedules.${branchIndex}.branch_id`,
  });

  const watchedDays = useWatch({
    control,
    name: `branch_schedules.${branchIndex}.days`,
  });

  const branchMeta = branches.find(b => Number(b.id) === Number(branchId));
  const hoursHint = formatBranchHoursHint(branchMeta);
  const closed = vacationChips(branchMeta);
  const { min: workMin, max: workMax } = getBranchWorkBounds(branchMeta);
  const rangeHint =
    workMin && workMax
      ? `Pick times between ${formatTimeRangeAmPm(workMin, workMax)} (branch opening hours).`
      : 'Pick times within this branch’s working hours when set on the branch.';

  const availableBranches = branches.filter(
    b => !takenBranchIds.includes(Number(b.id)) || Number(b.id) === Number(branchId)
  );

  const dayOptionsFor = useCallback(
    dayIndex => {
      const current = Number(watchedDays?.[dayIndex]?.day);
      const used = (watchedDays ?? [])
        .map((d, i) => (i !== dayIndex && d?.day !== '' && d?.day != null ? Number(d.day) : null))
        .filter(v => v != null && !Number.isNaN(v));
      const open = openDaysForBranch(branchMeta);
      return open.filter(opt => !used.includes(opt.value) || opt.value === current);
    },
    [watchedDays, branchMeta]
  );

  useEffect(() => {
    if (!branchMeta) return;
    const path = `branch_schedules.${branchIndex}.days`;
    const days = getValues(path);
    if (!days?.length) return;
    const vac = new Set((branchMeta.vacation_days ?? []).map(Number));
    const needsFix = days.some(d => vac.has(Number(d.day)));
    if (!needsFix) return;
    const next = days.map((d, idx) => {
      const dn = Number(d.day);
      if (!vac.has(dn)) return d;
      const others = days.map((x, i) => (i === idx ? null : Number(x.day))).filter(
        n => n != null && !Number.isNaN(n)
      );
      const openVals = openDaysForBranch(branchMeta).map(o => o.value);
      const pick = openVals.find(v => !others.includes(v)) ?? openVals[0] ?? 0;
      return { ...d, day: pick };
    });
    try {
      if (JSON.stringify(next) === JSON.stringify(days)) return;
    } catch {
      return;
    }
    setValue(path, next, { shouldValidate: true });
  }, [branchId, branchIndex, branchMeta, getValues, setValue]);

  const openDayList = openDaysForBranch(branchMeta);
  const usedDayValues = (watchedDays ?? [])
    .map(d => Number(d?.day))
    .filter(n => !Number.isNaN(n));
  const uniqueUsedDays = new Set(usedDayValues);
  const allWeekdaysUsed = openDayList.length > 0 && uniqueUsedDays.size >= openDayList.length;

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'visible' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack spacing={2}>
          <Controller
            name={`branch_schedules.${branchIndex}.branch_id`}
            control={control}
            render={({ field, fieldState }) => (
              <FormControl sx={{ maxWidth: 400 }} required error={Boolean(fieldState.error)}>
                <InputLabel id={`branch-sel-${branchIndex}`}>Branch</InputLabel>
                <Select
                  {...field}
                  labelId={`branch-sel-${branchIndex}`}
                  label="Branch"
                  value={field.value === '' || field.value === undefined ? '' : field.value}
                  onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={disabled}
                >
                  <MenuItem value="">
                    <em>Select branch</em>
                  </MenuItem>
                  {availableBranches.map(b => (
                    <MenuItem key={b.id} value={Number(b.id)}>
                      {b.name?.trim() || `Branch #${b.id}`}
                    </MenuItem>
                  ))}
                </Select>
                {fieldState.error?.message ? <FormHelperText>{fieldState.error.message}</FormHelperText> : null}
              </FormControl>
            )}
          />

          {branchMeta ? (
            <Stack spacing={0.75}>
              {hoursHint ? (
                <Typography variant="caption" color="text.secondary">
                  {hoursHint}
                </Typography>
              ) : null}
              {closed?.length ? (
                <Stack direction="row" flexWrap="wrap" gap={0.5} alignItems="center">
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                    Branch closed:
                  </Typography>
                  {closed.map(d => (
                    <Chip key={d} label={d} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                  ))}
                </Stack>
              ) : null}
            </Stack>
          ) : null}

          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', pt: 0.5 }}>
            Weekly slots at this branch
          </Typography>

          <Stack spacing={2}>
            {dayFields.map((df, dayIndex) => (
              <DayBlock
                key={df.id}
                branchIndex={branchIndex}
                dayIndex={dayIndex}
                disabled={disabled}
                onRemoveDay={() => removeDay(dayIndex)}
                dayOptions={dayOptionsFor(dayIndex)}
                branchMeta={branchMeta}
                workMin={workMin}
                workMax={workMax}
                rangeHint={rangeHint}
              />
            ))}
          </Stack>

          <Button
            size="medium"
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() =>
              appendDay({
                day: firstUnusedDay(branchMeta, watchedDays, -1),
                slots: [defaultSlotForBranch(branchMeta)],
              })
            }
            disabled={disabled || openDayList.length === 0 || allWeekdaysUsed}
            sx={{ alignSelf: 'flex-start', borderRadius: 2 }}
          >
            Add another weekday
          </Button>
          {openDayList.length === 0 && branchMeta ? (
            <Typography variant="caption" color="text.secondary">
              This branch has no working weekdays configured (all days marked closed). Update the branch or pick another
              location.
            </Typography>
          ) : null}
          {allWeekdaysUsed && openDayList.length > 0 ? (
            <Typography variant="caption" color="text.secondary">
              All open weekdays for this branch already have a block. Remove a day above to add a different weekday.
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function DoctorBranchSchedules({ branches, disabled }) {
  const { control, getValues } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'branch_schedules',
  });

  const branchCount = Array.isArray(branches) ? branches.length : 0;
  const canAddMoreBranches = branchCount > 0 && fields.length < branchCount;

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        Branch schedules <Typography component="span" variant="body2" color="text.secondary" fontWeight={400}>(optional)</Typography>
      </Typography>
     

      {fields.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            textAlign: 'center',
            borderRadius: 2,
            borderStyle: 'dashed',
            bgcolor: 'action.hover',
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No schedules yet. Add a branch block to set when this doctor is available.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => append(initialBranchSchedule())}
            disabled={disabled || branchCount === 0}
            sx={{ borderRadius: 2 }}
          >
            Add branch schedule
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2.5}>
          {fields.map((f, branchIndex) => {
            const otherIds = (getValues('branch_schedules') ?? [])
              .map((s, i) =>
                i !== branchIndex && s?.branch_id !== '' && s?.branch_id != null ? Number(s.branch_id) : null
              )
              .filter(Boolean);

            return (
              <Box key={f.id}>
                <Stack direction="row" justifyContent="flex-end" sx={{ mb: 0.5 }}>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Remove this branch schedule"
                    onClick={() => remove(branchIndex)}
                    disabled={disabled}
                  >
                    <DeleteOutlineOutlined fontSize="small" />
                  </IconButton>
                </Stack>
                <BranchScheduleCard
                  branchIndex={branchIndex}
                  branches={branches}
                  disabled={disabled}
                  takenBranchIds={otherIds}
                />
              </Box>
            );
          })}
        </Stack>
      )}

      {fields.length > 0 && canAddMoreBranches ? (
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => append(initialBranchSchedule())}
          disabled={disabled}
          sx={{ mt: 2, borderRadius: 2 }}
        >
          Add branch
        </Button>
      ) : null}

      {fields.length > 0 && !canAddMoreBranches && branchCount > 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          All branches have a schedule block. Remove one above if you need to reassign.
        </Typography>
      ) : null}
    </Box>
  );
}
