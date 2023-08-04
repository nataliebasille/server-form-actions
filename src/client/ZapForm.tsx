'use client';

import { useCallback, type ReactNode, useTransition, useState } from 'react';
import { type ZapServerAction } from '../zap';
import { type infer as Infer, type ZodError } from 'zod';
import { ZapFormContextProvider } from './ZapFormContextProvider';

type InferActionData<TAction> = TAction extends ZapServerAction<
  infer TSchema,
  any
>
  ? Infer<TSchema>
  : never;

export const ZapForm = <TAction extends ZapServerAction<any, any>>({
  action,
  children,
}: {
  action: TAction;
  children: ReactNode;
}) => {
  const [pending, run] = useTransition();
  const [previousResult, setPreviousResult] = useState<
    InferActionData<TAction> | undefined
  >(undefined);
  const [errors, setErrors] = useState<ZodError<any> | undefined>(undefined);
  const handleSubmit = useCallback(
    (...[event]: Parameters<JSX.IntrinsicElements['form']['onSubmit']>) => {
      event.preventDefault();

      run(async () => {
        const formData = new FormData(event.currentTarget);
        try {
          const result = await action(formData);
          setPreviousResult(result);
        } catch (error) {
          setErrors(error);
        }
      });
    },
    [run]
  );
  return (
    <ZapFormContextProvider data={previousResult} errors={errors}>
      <form onSubmit={handleSubmit}>{children}</form>
    </ZapFormContextProvider>
  );
};
