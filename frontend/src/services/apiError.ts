import type { TFunction } from 'i18next'

export class ApiError extends Error {
  code: string
  params?: Record<string, unknown>

  constructor(code: string, params?: Record<string, unknown>) {
    super(code)
    this.name = 'ApiError'
    this.code = code
    this.params = params
  }
}

/**
 * Reads the stable `errorCode` (and optional interpolation `params`) the
 * backend sends alongside its error responses, so the UI can translate the
 * error itself instead of displaying whatever language the server used.
 */
export async function readApiError(
  response: Response,
  fallbackCode: string,
): Promise<ApiError> {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    return new ApiError(fallbackCode)
  }

  try {
    const data: unknown = await response.json()

    if (
      typeof data === 'object' &&
      data !== null &&
      'errorCode' in data &&
      typeof data.errorCode === 'string' &&
      data.errorCode.length > 0
    ) {
      const params =
        'params' in data &&
        typeof data.params === 'object' &&
        data.params !== null
          ? (data.params as Record<string, unknown>)
          : undefined

      return new ApiError(data.errorCode, params)
    }
  } catch {
    return new ApiError(fallbackCode)
  }

  return new ApiError(fallbackCode)
}

/**
 * Translates an error thrown by an API call. Errors carrying a backend
 * `errorCode` are looked up under `api_error_<code>`; anything else (network
 * failures, unexpected shapes) falls back to the given translation key.
 */
export function translateApiError(
  t: TFunction,
  error: unknown,
  fallbackKey: string,
): string {
  if (error instanceof ApiError) {
    return t(`api_error_${error.code}`, {
      ...error.params,
      defaultValue: t(fallbackKey),
    })
  }

  return t(fallbackKey)
}
