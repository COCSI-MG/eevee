"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import { useField } from "formik";

interface FormikToggleProps {
  name: string;
  label: string;
  tooltip?: string;
  enabledLabel?: string;
  disabledLabel?: string;
}

export const FormikToggle = ({
  name,
  label,
  tooltip,
  enabledLabel = "Ativado",
  disabledLabel = "Desativado",
}: FormikToggleProps) => {
  const [field, , helpers] = useField<boolean>(name);

  const isChecked = Boolean(field.value);

  const statusId = `${name}-status`;

  return (
    <div className="flex flex-1 items-center justify-between gap-4 rounded-md border border-slate-700 bg-slate-700/20 p-3">
      <Label htmlFor={name} className="text-sm font-medium">
        {label} {tooltip && <Tooltip message={tooltip} />}
      </Label>

      <div className="flex shrink-0 items-center gap-3">
        <span id={statusId} className="text-sm text-slate-300">
          {isChecked ? enabledLabel : disabledLabel}
        </span>
        <Switch
          id={name}
          name={field.name}
          checked={isChecked}
          onCheckedChange={(checked) => void helpers.setValue(checked)}
          onBlur={() => void helpers.setTouched(true)}
          aria-describedby={statusId}
        />
      </div>
    </div>
  );
};
