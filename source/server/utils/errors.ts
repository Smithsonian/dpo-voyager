

export class HTTPError extends Error{
  constructor(public code :number, message :string){
    super(`[${code}] ${message}`);
  }
}

export class BadRequestError extends HTTPError{
  constructor(reason :string ="Bad Request"){
    super(400, reason);
  }
}
export class UnauthorizedError extends HTTPError{
  constructor(reason :string ="Unauthorized"){
    super(401, reason);
  }
}

export class ForbiddenError extends HTTPError{
  constructor(reason :string="Forbidden"){
    super(403, reason);
  }
}

export class NotFoundError extends HTTPError {
  constructor(reason :string="Not Found"){
    super(404, reason);
  }
}

export class ConflictError extends HTTPError {
  constructor(reason :string="Conflict"){
    super(409, reason);
  }
}
export class InternalError extends HTTPError {
  constructor(reason :string="Internal Server Error"){
    super(500, reason);
  }
}
