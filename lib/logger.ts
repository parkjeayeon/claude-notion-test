type LogLevel = 'info' | 'warn' | 'error'

interface LogMeta {
  durationMs?: number
  data?: unknown
  error?: {
    message: string
    code?: string
    stack?: string
  }
}

const isDev = process.env.NODE_ENV !== 'production'

const LEVEL_LABEL: Record<LogLevel, string> = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
}

function log(level: LogLevel, context: string, message: string, meta?: LogMeta): void {
  const timestamp = new Date().toISOString()

  if (isDev) {
    const label = LEVEL_LABEL[level]
    const parts: string[] = [`[${label}]`, context, message]
    if (meta?.durationMs !== undefined) parts.push(`(${meta.durationMs}ms)`)
    if (meta?.data !== undefined) parts.push(JSON.stringify(meta.data))
    if (meta?.error) parts.push(`error=${meta.error.message}`)
    const output = parts.join(' ')
    if (level === 'error') console.error(output)
    else if (level === 'warn') console.warn(output)
    else console.log(output)
    return
  }

  const entry: Record<string, unknown> = { timestamp, level, context, message }
  if (meta?.durationMs !== undefined) entry.durationMs = meta.durationMs
  if (meta?.data !== undefined) entry.data = meta.data
  if (meta?.error) entry.error = meta.error

  const line = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  info: (context: string, message: string, meta?: LogMeta) => log('info', context, message, meta),
  warn: (context: string, message: string, meta?: LogMeta) => log('warn', context, message, meta),
  error: (context: string, message: string, meta?: LogMeta) => log('error', context, message, meta),
}
