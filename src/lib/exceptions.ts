export class HttpException extends Error {
  public message = 'Bad Request';
  public statusCode = 400;
  constructor(message: string, statusCode: number) {
    super(message);
    this.message = message || this.message;
    this.statusCode = statusCode || this.statusCode;
  }
}

export class BadRequestException extends HttpException {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = 'You are not authorized') {
    super(message, 401);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = 'You are not allowed to access this resource') {
    super(message, 403);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = 'The requested resource is not found') {
    super(message, 404);
  }
}

export class ConflictException extends HttpException {
  constructor(message = 'Conflict on resource') {
    super(message, 409);
  }
}

export class PayloadTooLargeException extends HttpException {
  constructor(message = 'Too large payload') {
    super(message, 413);
  }
}

export class InternalServerException extends HttpException {
  constructor(message = 'Internal server error') {
    super(message, 500);
  }
}
