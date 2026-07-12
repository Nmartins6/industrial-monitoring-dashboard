export function getRuntimeName(): string {
  return process.release.name;
}

export function getEnvironment(): string {
  return process.env.NODE_ENV ?? 'development';
}
