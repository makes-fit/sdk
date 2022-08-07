import { AppError } from './types';

export function isAppErr(err: any): err is AppError {
  if ('xref' in err && 'status' in err && 'message' in err) {
    return true;
  }
  return false;
}
