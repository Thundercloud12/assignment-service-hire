export interface IValidationIssue {
  field: string;
  message: string;
}

export class ValidationError extends Error {
  public readonly statusCode: number;
  public readonly issues: IValidationIssue[];

  constructor(message: string, issues: IValidationIssue[]) {
    super(message);
    this.statusCode = 400;
    this.issues = issues;

    Error.captureStackTrace(this, this.constructor);
  }
}