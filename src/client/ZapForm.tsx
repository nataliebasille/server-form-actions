'use client';

import {
  useCallback,
  type ReactNode,
  useTransition,
  useState,
  useMemo,
} from 'react';
import { type ZapServerAction } from '../zap';
import { type infer as Infer, type ZodError } from 'zod';

type InferActionData<TAction> = TAction extends ZapServerAction<infer TSchema>
  ? Infer<TSchema>
  : never;

import { createContext, useContext, type PropsWithChildren } from 'react';

type ZapFormContextProps = {
  errors?: any;
  result?: any;
  submitting?: boolean;
};

const ZapFormContext = createContext<ZapFormContextProps | null>(null);

const ZapFormContextProvider = ({
  errors,
  result,
  submitting,
  children,
}: PropsWithChildren<ZapFormContextProps>) => {
  return (
    <ZapFormContext.Provider
      value={useMemo(
        () => ({ errors, result, submitting }),
        [errors, result, submitting]
      )}
    >
      {children}
    </ZapFormContext.Provider>
  );
};

export const useZapFormContext = () => {
  const context = useContext(ZapFormContext);
  if (!context) {
    throw new Error(
      'ZapFormContextProvider not found. Please add it to the component tree, usually by wrapping your form with <ZapForm />'
    );
  }
  return context;
};

type ZapFormProps<TAction extends ZapServerAction<any>> = {
  action: TAction;
  className?: string;
  children?: ReactNode;
};
export const ZapForm = <TAction extends ZapServerAction<any>>({
  action,
  children,
  className,
}: ZapFormProps<TAction>) => {
  const [pending, run] = useTransition();
  const [previousResult, setPreviousResult] = useState<
    InferActionData<TAction> | undefined
  >(undefined);
  const [errors, setErrors] = useState<any | undefined>(undefined);
  const handleSubmit = useCallback(
    (event: Parameters<JSX.IntrinsicElements['form']['onSubmit']>[0]) => {
      event.preventDefault();

      (run as unknown as (fn: () => Promise<void>) => void)(async () => {
        const formData = new FormData(event.currentTarget);
        const result = await action(formData);

        if (result.type === 'valid') {
          setPreviousResult(result.data);
          setErrors(undefined);
        } else {
          setPreviousResult(undefined);
          setErrors(result.errors);
        }
      });
    },
    [run]
  );

  return (
    <ZapFormContextProvider
      result={previousResult}
      errors={errors}
      submitting={pending}
    >
      <form className={className} onSubmit={handleSubmit}>
        {children}
      </form>
    </ZapFormContextProvider>
  );
};
