import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log pour le développement
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Erreur Mongoose - ID invalide
  if (err.name === 'CastError') {
    const message = 'Ressource introuvable';
    error = new AppError(message, 404);
  }

  // Erreur Mongoose - Duplicata
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} existe déjà`;
    error = new AppError(message, 400);
  }

  // Erreur Mongoose - Validation
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val: any) => val.message);
    const message = messages.join(', ');
    error = new AppError(message, 400);
  }

  // Erreur JWT - Token invalide
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token invalide';
    error = new AppError(message, 401);
  }

  // Erreur JWT - Token expiré
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expiré';
    error = new AppError(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Route non trouvée - ${req.originalUrl}`, 404);
  next(error);
};
