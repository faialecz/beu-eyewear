// Shape returned by form server actions and read by useActionState on the client.
export interface FormState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  // Submitted text echoed back so it survives the form reset React does after an action.
  values?: Record<string, string>;
}
