/**
 * Matchday doesn't have Sentry configured (Golafly main does — see its
 * lib/sentry-logger.ts for the full Sentry.withScope version). This keeps
 * the same call signature so the ported form files don't need touching,
 * but logs to the console instead of shipping to a Sentry project.
 */
export const captureFormError = (
  error: unknown,
  formName: string,
  formData: object,
) => {
  const sanitizedData = { ...formData } as Record<string, unknown>
  if ('password' in sanitizedData) sanitizedData.password = '[MASKED]'

  console.error(`[${formName}] form submission error:`, error, {
    formData: sanitizedData,
  })
}
