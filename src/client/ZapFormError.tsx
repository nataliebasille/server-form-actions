'use client';

import { useZapFormContext } from './ZapForm';

type ZapFormErrorProps = {
  className?: string;
  name: string;
};

export const ZapFormError = ({ className, name }: ZapFormErrorProps) => {
  const { errors } = useZapFormContext();
  const fieldError = errors && errors[name];

  return fieldError && <span className={className}>{fieldError}</span>;
};
